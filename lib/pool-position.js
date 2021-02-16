import BigNumber from 'bignumber.js';
import { erc20Abi } from './abi/erc20';
import { balancerPoolAbi } from './abi/balancer-pool';
import { uniswapPairAbi } from './abi/uniswap';
import { oneinchPairAbi } from './abi/oneinche-pair';
import { sushiswapPairAbi } from './abi/sushiswap-pair';
import { sushiMasterchefAbi } from './abi/sushi-masterchef';
import { bigToNumber, getContract, getTokenData } from './eth-helpers';

export const PoolType = {
    BALANCER: 'BALANCER',
    UNISWAP: 'UNISWAP',
    SUSHISWAP: 'SUSHISWAP',
    ONEINCH: 'ONEINCH'
}

const EmptyAddress = '0x0000000000000000000000000000000000000000';

export async function lpPositionStatus(holderInfo, poolType, poolAddress, web3, optionalFarmAddress) {
    switch(poolType) {
        case PoolType.BALANCER:
            return getBalancerPoolData(holderInfo, poolAddress, web3);
        case PoolType.UNISWAP:
            return getUniswapPoolData(holderInfo, poolAddress, web3);
        case PoolType.SUSHISWAP:
            return getSushiswapPoolData(holderInfo, poolAddress, optionalFarmAddress || '', web3);
        case PoolType.ONEINCH:
            return getOneInchPoolData(holderInfo, poolAddress, optionalFarmAddress || '', web3);
        default:
            throw new Error(`lpPositionStatus: Pool ${poolType} not recognized`);
    }
}

function newPoolData(PoolAddress, HolderAddress, totalLPSupply, holderLPBalance, lpTokenData, positionValue, farmAddress, indirectFranctionOfPool){
    const holderPoolData = {
        PoolAddress,
        TotalLPSupply: bigToNumber(totalLPSupply, lpTokenData),
        HolderAddress : isAddress(HolderAddress) ? HolderAddress : 'Not Given',
        HolderLPBalance: bigToNumber(holderLPBalance, lpTokenData),
    };
    if(isAddress(farmAddress)) {
        holderPoolData.FarmAddress = farmAddress;
        holderPoolData.HolderLPBalanceThroughFarm = bigToNumber(totalLPSupply.multipliedBy(indirectFranctionOfPool), lpTokenData);
    }
    holderPoolData.PositionValue = positionValue;
    return holderPoolData
}

async function getBalancerPoolData(holderInfo, poolAddress, web3) {
    const pool = getContract(poolAddress, balancerPoolAbi, web3);
    const poolDataTxs = [
        pool.methods.totalSupply().call(),
        pool.methods.decimals().call(),
        pool.methods.getFinalTokens().call()
    ];
    if (isAddress(holderInfo)) {
        poolDataTxs.push(pool.methods.balanceOf(holderInfo).call());
    }
    const poolDataRes = await Promise.all(poolDataTxs);
 
    const totalLp = new BigNumber(poolDataRes[0])
    const holderLp = new BigNumber(isAddress(holderInfo) ? poolDataRes[3] : holderInfo);
    const lpTokenData = { Decimals: poolDataRes[2] };
    const fractionOfPool = holderLp.dividedBy(totalLp);

    const tokenTxs = [];
    poolDataRes[2].map(tokenAddress => {
        tokenTxs.push(getTokenData(tokenAddress, erc20Abi, web3));
        tokenTxs.push(pool.methods.getBalance(tokenAddress).call());
    });
    const tokenRes = await Promise.all(tokenTxs);
    const positionValues = [];
    for(let i = 0;i < tokenRes.length;i+=2){
        tokenRes[i].Balance = bigToNumber(new BigNumber(tokenRes[i+1]).multipliedBy(fractionOfPool), tokenRes[i]);
        positionValues.push(tokenRes[i]);
    }

    return newPoolData(poolAddress, holderInfo, totalLp, holderLp, lpTokenData, positionValues);     
}

async function getUniswapPoolData(holderInfo, poolAddress, web3) {
    const pool = getContract(poolAddress, uniswapPairAbi, web3);
    const poolDataTxs = [
        pool.methods.totalSupply().call(),
        pool.methods.decimals().call(),
        pool.methods.token0().call(),
        pool.methods.token1().call(),
        pool.methods.getReserves().call()
    ];
    if (isAddress(holderInfo)) {
        poolDataTxs.push(pool.methods.balanceOf(holderInfo).call());
    }
    const poolDataRes = await Promise.all(poolDataTxs);
 
    const totalLp = new BigNumber(poolDataRes[0])
    const holderLp = new BigNumber(isAddress(holderInfo) ? poolDataRes[5] : holderInfo);
    const lpTokenData = { Decimals: poolDataRes[1] };
    const fractionOfPool = holderLp.dividedBy(totalLp);

    const tokenTxs = [
        getTokenData(poolDataRes[2], erc20Abi, web3),
        getTokenData(poolDataRes[3], erc20Abi, web3)       
    ];
    const positionValues = await Promise.all(tokenTxs);
    positionValues[0].Balance = bigToNumber(new BigNumber(poolDataRes[4]["0"]).multipliedBy(fractionOfPool), positionValues[0]);
    positionValues[1].Balance = bigToNumber(new BigNumber(poolDataRes[4]["1"]).multipliedBy(fractionOfPool), positionValues[1]);

    return newPoolData(poolAddress, holderInfo, totalLp, holderLp, lpTokenData, positionValues);     
}

const MasterChefAddress = '0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd';
async function getSushiswapPoolData(holderInfo, poolAddress, farmNumber, web3) {
    const pool = getContract(poolAddress, sushiswapPairAbi, web3);
    const poolDataTxs = [
        pool.methods.totalSupply().call(),
        pool.methods.decimals().call(),
        pool.methods.token0().call(),
        pool.methods.token1().call(),
        pool.methods.getReserves().call()
    ];
    if (isAddress(holderInfo)) {
        poolDataTxs.push(pool.methods.balanceOf(holderInfo).call());
        if (farmNumber !== '') {
            const masterChef = getContract(MasterChefAddress, sushiMasterchefAbi, web3);
            poolDataTxs.push(masterChef.methods.userInfo(farmNumber, holderInfo).call());
        }
    }
    const poolDataRes = await Promise.all(poolDataTxs);
 
    const totalLp = new BigNumber(poolDataRes[0])
    const holderLp = new BigNumber(isAddress(holderInfo) ? poolDataRes[5] : holderInfo);
    const lpTokenData = { Decimals: poolDataRes[1] };
    const directFractionOfPool = holderLp.dividedBy(totalLp);
    let indirectFranctionOfPool = new BigNumber(0);
    if (isAddress(holderInfo) && farmNumber !== '') {
        const holderLpInFarm = new BigNumber(poolDataRes[6]["0"])
        indirectFranctionOfPool = holderLpInFarm.dividedBy(totalLp);
    }
    const fractionOfPool = directFractionOfPool.plus(indirectFranctionOfPool);

    const tokenTxs = [
        getTokenData(poolDataRes[2], erc20Abi, web3),
        getTokenData(poolDataRes[3], erc20Abi, web3)       
    ];
    const positionValues = await Promise.all(tokenTxs);
    positionValues[0].Balance = bigToNumber(new BigNumber(poolDataRes[4]["0"]).multipliedBy(fractionOfPool), positionValues[0]);
    positionValues[1].Balance = bigToNumber(new BigNumber(poolDataRes[4]["1"]).multipliedBy(fractionOfPool), positionValues[1]);

    return newPoolData(poolAddress, holderInfo, totalLp, holderLp, lpTokenData, positionValues, farmNumber !== '' ? MasterChefAddress : '', indirectFranctionOfPool);     
}

async function getOneInchPoolData(holderInfo, poolAddress, farmAddress, web3) {
    const pool = getContract(poolAddress, oneinchPairAbi, web3);
    const poolDataTxs = [
        pool.methods.totalSupply().call(),
        pool.methods.decimals().call(),
        pool.methods.getTokens().call(),
    ];
    if (isAddress(holderInfo)) {
        poolDataTxs.push(pool.methods.balanceOf(holderInfo).call());
        if (isAddress(farmAddress)) {
            const farm = getContract(farmAddress, erc20Abi, web3);
            poolDataTxs.push(pool.methods.balanceOf(farmAddress).call());
            poolDataTxs.push(farm.methods.totalSupply().call());
            poolDataTxs.push(farm.methods.balanceOf(holderInfo).call());
        }
    }
    const poolDataRes = await Promise.all(poolDataTxs);

    const totalLp = new BigNumber(poolDataRes[0])
    const holderLp = new BigNumber(isAddress(holderInfo) ? poolDataRes[3] : holderInfo);
    const lpTokenData = { Decimals: poolDataRes[1] };
    const directFractionOfPool = holderLp.dividedBy(totalLp);
    let indirectFranctionOfPool = new BigNumber(0);
    if (isAddress(holderInfo) && isAddress(farmAddress)) {
        const farmLp = new BigNumber(poolDataRes[4])
        const holderFarmTokens = new BigNumber(poolDataRes[6])
        const totalFarmTokens = new BigNumber(poolDataRes[5])
        indirectFranctionOfPool = farmLp.dividedBy(totalLp).multipliedBy(holderFarmTokens).dividedBy(totalFarmTokens);
    }
    const fractionOfPool = directFractionOfPool.plus(indirectFranctionOfPool);

    const tokenTxs = [];
    poolDataRes[2].map(tokenAddress => {
        tokenTxs.push(getOneInchTokenData(tokenAddress, erc20Abi, web3));
        tokenTxs.push(pool.methods.getBalanceForRemoval(tokenAddress).call());
    });
    const tokenRes = await Promise.all(tokenTxs);
    const positionValues = [];
    for(let i = 0;i < tokenRes.length;i+=2){
        tokenRes[i].Balance = bigToNumber(new BigNumber(tokenRes[i+1]).multipliedBy(fractionOfPool), tokenRes[i]);
        positionValues.push(tokenRes[i]);
    }

    return newPoolData(poolAddress, holderInfo, totalLp, holderLp, lpTokenData, positionValues, farmAddress, indirectFranctionOfPool);    
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

function isAddress(address) {
    return typeof address === 'string' && address.startsWith('0x');
}