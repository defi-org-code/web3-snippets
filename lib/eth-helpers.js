import BigNumber from "bignumber.js";
import Web3 from "web3";

export function getWeb3(endpoint) {
  const web3 = new Web3(endpoint);
  web3.eth.transactionBlockTimeout = 0; // to stop web3 from polling pending tx
  web3.eth.transactionPollingTimeout = 0; // to stop web3 from polling pending tx
  web3.eth.transactionConfirmationBlocks = 1; // to stop web3 from polling pending tx
  return web3;
}

// Todo: if not a client web need to change this as the new here leaks
export function getContract(address, abi, web3) {
    return new web3.eth.Contract(abi, address);
}

export async function getTokenData(address, abi, web3, holderAddress) {
    const tokenContract = getContract(address, abi, web3);
    const tokenDataTxs = [
        tokenContract.methods.decimals().call(),
        tokenContract.methods.name().call(),
        tokenContract.methods.symbol().call(),
    ];
    if (isAddress(holderAddress)) {
        tokenDataTxs.push(tokenContract.methods.balanceOf(holderAddress).call());
    }
    const tokenRawDatas = await Promise.all(tokenDataTxs);
    const balance = new BigNumber(isAddress(holderAddress) ? tokenRawDatas[3] : 0)
    return {
        Address: address,
        Decimals: tokenRawDatas[0],
        Name: tokenRawDatas[1],
        Symbol: tokenRawDatas[2],
        Balance: bigToNumber(balance, tokenRawDatas[0])    
    };
}

export function bigToNumber(amount, tokenData) {
    const decimals = typeof tokenData === 'string' ? tokenData : tokenData.Decimals;
    return amount.dividedBy(`1e${decimals}`).toNumber();
}

export function uint256ToBigNumber(amount, tokenData) {
    return new BigNumber(amount).dividedBy(`1e${tokenData.Decimals}`);
}
  
export function isAddress(address) {
    return typeof address === 'string' && address.startsWith('0x');
}