import BigNumber from 'bignumber.js';
import { erc20Abi } from './abi/erc20';
import { balancerPoolAbi } from './abi/balancer-pool';
import { uniswapPairAbi } from './abi/uniswap';
import { oneinchPairAbi } from './abi/oneinche-pair';
import { sushiswapPairAbi } from './abi/sushiswap-pair';
import { bigToNumber, getContract, getTokenData } from './eth-helpers';

export const PoolType = {
    BALANCER: 'BALANCER',
    UNISWAP: 'UNISWAP',
    SUSHISWAP: 'SUSHISWAP',
    ONEINCH: 'ONEINCH'
}

const EmptyAddress = '0x0000000000000000000000000000000000000000';

export async function lpPositionStatus({holderAddress, poolType, poolAddress, web3}) {
    switch(poolType) {
        case PoolType.BALANCER:
            return getBalancerPoolData(holderAddress, poolAddress, web3);
        case PoolType.UNISWAP:
            return getUniswapPoolData(holderAddress, poolAddress, web3, false);
        case PoolType.SUSHISWAP:
            return getUniswapPoolData(holderAddress, poolAddress, web3, true);
        case PoolType.ONEINCH:
            return getOneInchPoolData(holderAddress, poolAddress, web3);
        default:
            throw new Error(`lpPositionStatus: Pool ${poolType} not recognized`);
    }
}

function newPoolData(PoolAddress, TotalLPSupply, HolderAddress, HolderLPBalance, PositionValue){
    return {
        PoolAddress,
        TotalLPSupply,
        HolderAddress,
        HolderLPBalance,
        PositionValue,
    };
}

async function getBalancerPoolData(holderAddress, poolAddress, web3) {
    const pool = getContract(poolAddress, balancerPoolAbi, web3);
    const poolDataTxs = [
        pool.methods.totalSupply().call(),
        pool.methods.balanceOf(holderAddress).call(),
        pool.methods.decimals().call(),
        pool.methods.getFinalTokens().call()
    ];
    const poolDataRes = await Promise.all(poolDataTxs);
 
    const totalLp = new BigNumber(poolDataRes[0])
    const holderLp = new BigNumber(poolDataRes[1]);
    const lpTokenData = { Decimals: poolDataRes[2] };
    const fractionOfPool = holderLp.dividedBy(totalLp);

    const tokenTxs = [];
    poolDataRes[3].map(tokenAddress => {
        tokenTxs.push(getTokenData(tokenAddress, erc20Abi, web3));
        tokenTxs.push(pool.methods.getBalance(tokenAddress).call());
    });
    const tokenRes = await Promise.all(tokenTxs);
    const positionValues = [];
    for(let i = 0;i < tokenRes.length;i+=2){
        tokenRes[i].Balance = bigToNumber(new BigNumber(tokenRes[i+1]).multipliedBy(fractionOfPool), tokenRes[i]);
        positionValues.push(tokenRes[i]);
    }

    return newPoolData(poolAddress, bigToNumber(totalLp, lpTokenData), holderAddress, bigToNumber(holderLp, lpTokenData), positionValues);     
}

async function getUniswapPoolData(holderAddress, poolAddress, web3, isSushi) {
    const pool = getContract(poolAddress, isSushi ? sushiswapPairAbi : uniswapPairAbi, web3);
    const poolDataTxs = [
        pool.methods.totalSupply().call(),
        pool.methods.balanceOf(holderAddress).call(),
        pool.methods.decimals().call(),
        pool.methods.token0().call(),
        pool.methods.token1().call(),
        pool.methods.getReserves().call()
    ];
    const poolDataRes = await Promise.all(poolDataTxs);
 
    const totalLp = new BigNumber(poolDataRes[0])
    const holderLp = new BigNumber(poolDataRes[1]);
    const lpTokenData = { Decimals: poolDataRes[2] };
    const fractionOfPool = holderLp.dividedBy(totalLp);

    const tokenTxs = [
        getTokenData(poolDataRes[3], erc20Abi, web3),
        getTokenData(poolDataRes[4], erc20Abi, web3)       
    ];
    const positionValues = await Promise.all(tokenTxs);
    positionValues[0].Balance = bigToNumber(new BigNumber(poolDataRes[5]["0"]).multipliedBy(fractionOfPool), positionValues[0]);
    positionValues[1].Balance = bigToNumber(new BigNumber(poolDataRes[5]["1"]).multipliedBy(fractionOfPool), positionValues[1]);

    return newPoolData(poolAddress, bigToNumber(totalLp, lpTokenData), holderAddress, bigToNumber(holderLp, lpTokenData), positionValues);      
}

async function getOneInchPoolData(holderAddress, poolAddress, web3) {
    const pool = getContract(poolAddress, oneinchPairAbi, web3);
    const poolDataTxs = [
        pool.methods.totalSupply().call(),
        pool.methods.balanceOf(holderAddress).call(),
        pool.methods.decimals().call(),
        pool.methods.getTokens().call(),
    ];
    const poolDataRes = await Promise.all(poolDataTxs);

    const totalLp = new BigNumber(poolDataRes[0])
    const holderLp = new BigNumber(poolDataRes[1]);
    const lpTokenData = { Decimals: poolDataRes[2] };
    const fractionOfPool = holderLp.dividedBy(totalLp);

    const tokenTxs = [];
    poolDataRes[3].map(tokenAddress => {
        tokenTxs.push(getOneInchTokenData(tokenAddress, erc20Abi, web3));
        tokenTxs.push(pool.methods.getBalanceForRemoval(tokenAddress).call());
    });
    const tokenRes = await Promise.all(tokenTxs);
    const positionValues = [];
    for(let i = 0;i < tokenRes.length;i+=2){
        tokenRes[i].Balance = bigToNumber(new BigNumber(tokenRes[i+1]).multipliedBy(fractionOfPool), tokenRes[i]);
        positionValues.push(tokenRes[i]);
    }

    return newPoolData(poolAddress, bigToNumber(totalLp, lpTokenData), holderAddress, bigToNumber(holderLp, lpTokenData), positionValues);      
}

async function getOneInchTokenData(tokenAddress, erc20Abi, web3) {
    if (tokenAddress === EmptyAddress) {
        return {
            Address: '0x0000000000000000000000000000000000000000',
            Decimals: '18',
            Name: 'Ether',
            Symbol: 'ETH',
        };
    } else {
        return getTokenData(tokenAddress, erc20Abi, web3);
    }
}