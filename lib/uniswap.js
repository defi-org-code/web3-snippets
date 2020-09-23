import BigNumber from "bignumber.js";
import {uniswapPairAbi} from "./uniswap-abi";

// analyze the current position for a liquidity provider (lp) in a uniswap pair
// web3 - initialized web3 instance used for read only
// fromBlock - eth block number to start analyzing activity from (use 0 for genesis)
// toBlock - eth block number to end analyzing activity at (use "latest" for most recent)
// pair - the address of the pair contract (0x string)
// lp - the address of the liquidity provider (0x string)
export async function lpPosition({ web3, fromBlock, toBlock, pair, lp }) {
  const pairContract = new web3.eth.Contract(uniswapPairAbi, pair);
  const addEvents = await pairContract.getPastEvents("Transfer", {
    filter: {
      from: "0x0000000000000000000000000000000000000000",
      to: lp,
    },
    fromBlock,
    toBlock,
  });
  console.log(
    addEvents.map(({ transactionHash, returnValues }) => ({
      txHash: transactionHash,
      value: new BigNumber(returnValues.value).dividedBy("1e6").toString(10),
    }))
  );
  const removeEvents = await pairContract.getPastEvents("Transfer", {
    filter: {
      from: lp,
      to: "0x0000000000000000000000000000000000000000",
    },
    fromBlock,
    toBlock,
  });
  console.log(removeEvents);
}
