import BigNumber from "bignumber.js";
import { fetchJson } from "./helpers";
import { erc20Abi } from "./erc20-abi";

export async function getTokenData(web3, address) {
  address = web3.utils.toChecksumAddress(address);
  const coingecko = await fetchJson(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`);
  const decimals = await new web3.eth.Contract(erc20Abi, address).methods.decimals().call();
  return {
    Address: address,
    Decimals: decimals,
    Name: coingecko.name,
    Symbol: coingecko.symbol.toUpperCase(),
    CurrentPriceUSD: new BigNumber(coingecko.market_data.current_price.usd),
    CurrentPriceBTC: new BigNumber(coingecko.market_data.current_price.btc),
    CurrentPriceETH: new BigNumber(coingecko.market_data.current_price.eth),
  };
}

export function uint256ToBigNumber(amount, tokenData) {
  return new BigNumber(amount).dividedBy(`1e${tokenData.Decimals}`);
}
