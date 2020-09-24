import _ from "lodash";
import BigNumber from "bignumber.js";
import { uniswapPairAbi } from "./uniswap-abi";
import { getTokenData, uint256ToBigNumber } from "./erc20-helpers";
import { sleep } from "./helpers";

const mintEventTopic0 = "0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f";
const burnEventTopic0 = "0xdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496";

// analyze the current position (impermanent loss) for a liquidity provider (lp) in a uniswap pair
// web3 - initialized web3 instance used for read only
// fromBlock - eth block number to start analyzing activity from (use 0 for genesis)
// toBlock - eth block number to end analyzing activity at (use "latest" for most recent)
// pair - the address of the pair contract (0x string)
// lp - the address of the liquidity provider (0x string)
export async function lpPosition({ web3, fromBlock, toBlock, pair, lp }) {
  const res = {
    Tokens: [],
    LiquidityChanges: [],
    SumLpTokens: new BigNumber(0),
    SumTokenDeposits: [new BigNumber(0), new BigNumber(0)],
    AvailableTokensToWithdraw: [undefined, undefined],
    TotalWorth: {},
    AvailableAfterRebalance: [],
  };

  if (!fromBlock) fromBlock = 0;
  if (!toBlock) toBlock = "latest";
  fromBlock = parseInt(fromBlock);
  if (toBlock !== "latest") toBlock = parseInt(toBlock);

  const pairContract = new web3.eth.Contract(uniswapPairAbi, pair);

  // token data
  const token0 = await pairContract.methods.token0().call();
  res.Tokens[0] = await getTokenData(web3, token0);
  const token1 = await pairContract.methods.token1().call();
  res.Tokens[1] = await getTokenData(web3, token1);

  // add remove liquidity events
  const addEvents = await pairContract.getPastEvents("Transfer", {
    filter: {
      from: "0x0000000000000000000000000000000000000000",
      to: lp,
    },
    fromBlock,
    toBlock,
  });
  res.LiquidityChanges.push(
    ...addEvents.map(({ transactionHash, blockNumber, returnValues }) => ({
      BlockNumber: blockNumber,
      TxHash: transactionHash,
      LpTokenDelta: new BigNumber(returnValues.value).dividedBy("1e18"),
      SumLpTokensAfter: undefined,
      TokenDepositDelta: [],
    }))
  );
  const removeEvents = await pairContract.getPastEvents("Transfer", {
    filter: {
      from: lp,
      to: pair,
    },
    fromBlock,
    toBlock,
  });
  res.LiquidityChanges.push(
    ...removeEvents.map(({ transactionHash, blockNumber, returnValues }) => ({
      BlockNumber: blockNumber,
      TxHash: transactionHash,
      LpTokenDelta: new BigNumber(returnValues.value).dividedBy("1e18").negated(),
      SumLpTokensAfter: undefined,
      TokenDepositDelta: [],
    }))
  );
  res.LiquidityChanges.sort((a, b) => a.BlockNumber - b.BlockNumber);

  // download all receipts for additional logs
  for (const change of res.LiquidityChanges) {
    await sleep(200); // don't stress infura api
    const receipt = await web3.eth.getTransactionReceipt(change.TxHash);
    for (const log of receipt.logs) {
      if (log.topics[0].toLowerCase() === mintEventTopic0) {
        const inputsAbi = _.find(uniswapPairAbi, (en) => en.name === "Mint").inputs;
        const decoded = web3.eth.abi.decodeLog(inputsAbi, log.data, _.drop(log.topics, 1));
        change.TokenDepositDelta[0] = uint256ToBigNumber(decoded.amount0, res.Tokens[0]);
        change.TokenDepositDelta[1] = uint256ToBigNumber(decoded.amount1, res.Tokens[1]);
      }
      if (log.topics[0].toLowerCase() === burnEventTopic0) {
        const inputsAbi = _.find(uniswapPairAbi, (en) => en.name === "Burn").inputs;
        const decoded = web3.eth.abi.decodeLog(inputsAbi, log.data, _.drop(log.topics, 1));
        change.TokenDepositDelta[0] = uint256ToBigNumber(decoded.amount0, res.Tokens[0]).negated();
        change.TokenDepositDelta[1] = uint256ToBigNumber(decoded.amount1, res.Tokens[1]).negated();
      }
    }
  }

  // sums
  for (const change of res.LiquidityChanges) {
    res.SumLpTokens = res.SumLpTokens.plus(change.LpTokenDelta);
    change.SumLpTokensAfter = new BigNumber(res.SumLpTokens);
    res.SumTokenDeposits[0] = res.SumTokenDeposits[0].plus(change.TokenDepositDelta[0]);
    res.SumTokenDeposits[1] = res.SumTokenDeposits[1].plus(change.TokenDepositDelta[1]);
  }

  // available to withdraw
  const totalSupply = await pairContract.methods.totalSupply().call();
  const totalSupplyLpTokens = new BigNumber(totalSupply).dividedBy("1e18");
  const fractionOfPool = res.SumLpTokens.dividedBy(totalSupplyLpTokens);
  const reserves = await pairContract.methods.getReserves().call();
  const token0Reserve = uint256ToBigNumber(reserves._reserve0, res.Tokens[0]);
  const token1Reserve = uint256ToBigNumber(reserves._reserve1, res.Tokens[1]);
  res.AvailableTokensToWithdraw[0] = token0Reserve.multipliedBy(fractionOfPool);
  res.AvailableTokensToWithdraw[1] = token1Reserve.multipliedBy(fractionOfPool);

  // worth
  res.TotalWorth.SumTokenDeposits = {
    CurrentPriceUSD: calcWorth(res.SumTokenDeposits, res.Tokens, "CurrentPriceUSD"),
    CurrentPriceBTC: calcWorth(res.SumTokenDeposits, res.Tokens, "CurrentPriceBTC"),
    CurrentPriceETH: calcWorth(res.SumTokenDeposits, res.Tokens, "CurrentPriceETH"),
  };
  res.TotalWorth.AvailableTokensToWithdraw = {
    CurrentPriceUSD: calcWorth(res.AvailableTokensToWithdraw, res.Tokens, "CurrentPriceUSD"),
    CurrentPriceBTC: calcWorth(res.AvailableTokensToWithdraw, res.Tokens, "CurrentPriceBTC"),
    CurrentPriceETH: calcWorth(res.AvailableTokensToWithdraw, res.Tokens, "CurrentPriceETH"),
  };

  // rebalance
  res.AvailableAfterRebalance[0] = rebalance(res.AvailableTokensToWithdraw, res.Tokens, 0, res.SumTokenDeposits[0]);
  res.AvailableAfterRebalance[1] = rebalance(res.AvailableTokensToWithdraw, res.Tokens, 1, res.SumTokenDeposits[1]);

  return res;
}

function calcWorth(amountArray, tokenDataArray, currentPriceField) {
  const worth0 = amountArray[0].multipliedBy(tokenDataArray[0][currentPriceField]);
  const worth1 = amountArray[1].multipliedBy(tokenDataArray[1][currentPriceField]);
  return worth0.plus(worth1);
}

function rebalance(amountArray, tokenDataArray, identicalIndex, targetAmount) {
  const res = [];
  res[identicalIndex] = new BigNumber(targetAmount);
  const diffInOriginalToken = amountArray[identicalIndex].minus(res[identicalIndex]);
  const diffInOtherToken = diffInOriginalToken
    .dividedBy(tokenDataArray[1 - identicalIndex].CurrentPriceUSD)
    .multipliedBy(tokenDataArray[identicalIndex].CurrentPriceUSD);
  res[1 - identicalIndex] = amountArray[1 - identicalIndex].plus(diffInOtherToken);
  return res;
}
