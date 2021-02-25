import BigNumber from 'bignumber.js';
import { erc20Abi } from './abi/erc20';
import { balancerPoolAbi } from './abi/balancer-pool';
import { uniswapPairAbi } from './abi/uniswap';
import { oneinchPairAbi } from './abi/oneinche-pair';
import { sushiswapPairAbi } from './abi/sushiswap-pair';
import { sushiMasterchefAbi } from './abi/sushi-masterchef';
import { bigToNumber, getContract, getTokenData, isAddress } from './eth-helpers';
import { oneInchFarmAbi } from './abi/one-inch-farm';
import { fetchJsonPost } from './helpers';

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

function newPoolData(PoolAddress, HolderAddress, totalLPSupply, holderLPBalance, lpTokenDecimals, positionValue, farmAddress, indirectFranctionOfPool, farmRewardTokenData){
    const holderPoolData = {
        PoolAddress,
        TotalLPSupply: bigToNumber(totalLPSupply, lpTokenDecimals),
        HolderAddress : isAddress(HolderAddress) ? HolderAddress : 'Not Given',
        HolderLPBalance: bigToNumber(holderLPBalance, lpTokenDecimals),
    };
    if(isAddress(farmAddress)) {
        holderPoolData.FarmAddress = farmAddress;
        holderPoolData.HolderLPBalanceThroughFarm = bigToNumber(totalLPSupply.multipliedBy(indirectFranctionOfPool), lpTokenDecimals);
        holderPoolData.UnclaimedReward = farmRewardTokenData;
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
    const lpTokenDecimals = poolDataRes[2];
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

    return newPoolData(poolAddress, holderInfo, totalLp, holderLp, lpTokenDecimals, positionValues);     
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
    const lpTokenDecimals = poolDataRes[1];
    const fractionOfPool = holderLp.dividedBy(totalLp);

    const tokenTxs = [
        getTokenData(poolDataRes[2], erc20Abi, web3),
        getTokenData(poolDataRes[3], erc20Abi, web3)       
    ];
    const positionValues = await Promise.all(tokenTxs);
    positionValues[0].Balance = bigToNumber(new BigNumber(poolDataRes[4]["0"]).multipliedBy(fractionOfPool), positionValues[0]);
    positionValues[1].Balance = bigToNumber(new BigNumber(poolDataRes[4]["1"]).multipliedBy(fractionOfPool), positionValues[1]);

    return newPoolData(poolAddress, holderInfo, totalLp, holderLp, lpTokenDecimals, positionValues);     
}

const MasterChefAddress = '0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd';
const SushiTokenAddress = '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2';
async function getSushiswapPoolData(holderInfo, poolAddress, farmPoolNumber, web3) {
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
        if (farmPoolNumber !== '') {
            const masterChef = getContract(MasterChefAddress, sushiMasterchefAbi, web3);
            poolDataTxs.push(masterChef.methods.userInfo(farmPoolNumber, holderInfo).call());
            poolDataTxs.push(masterChef.methods.pendingSushi(farmPoolNumber, holderInfo).call());
            poolDataTxs.push(getTokenData(SushiTokenAddress, erc20Abi, web3, holderInfo));
            poolDataTxs.push(sushiCalculateLocked(holderInfo, farmPoolNumber));
        }
    }
    const poolDataRes = await Promise.all(poolDataTxs);
 
    const totalLp = new BigNumber(poolDataRes[0])
    const holderLp = new BigNumber(isAddress(holderInfo) ? poolDataRes[5] : holderInfo);
    const lpTokenDecimals = poolDataRes[1];
    const directFractionOfPool = holderLp.dividedBy(totalLp);
    let indirectFranctionOfPool = new BigNumber(0);
    if (isAddress(holderInfo) && farmPoolNumber !== '') {
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

    const sushiRewardTokenData = poolDataRes[8];
    if (isAddress(holderInfo) && farmPoolNumber !== '') {
        sushiRewardTokenData.ClaimedBalanceLeftInWallet = sushiRewardTokenData.Balance;
        delete sushiRewardTokenData.Balance;
        sushiRewardTokenData.UnclaimedUnlockedBalance = bigToNumber(new BigNumber(poolDataRes[7]), sushiRewardTokenData);
        sushiRewardTokenData.UnclaimedLockedBalanceEstimate = Number(poolDataRes[9]);
    }
    return newPoolData(poolAddress, holderInfo, totalLp, holderLp, lpTokenDecimals, positionValues, farmPoolNumber !== '' ? MasterChefAddress : '', indirectFranctionOfPool, sushiRewardTokenData);     
}

const SushiGraphUrl = "https://api.thegraph.com/subgraphs/name/sushiswap/master-chef"
async function sushiCalculateLocked(holderAddress, farmPoolId) {
    const data = `{ users(where: {address: "${holderAddress}"}) { amount sushiHarvested rewardDebt pool { id accSushiPerShare } } }`

    const response = await fetchJsonPost(SushiGraphUrl, JSON.stringify({query:data}));
    if (response.errors) {
        throw new Error(`Graph query error: ${response.errors[0].message}`);
    }

    for(const user of response.data.users) {
        if (user.pool.id === farmPoolId) {
            const sushiPerShare = new BigNumber(user.pool.accSushiPerShare).dividedBy('1e12');
            const sushiDebt = new BigNumber(user.rewardDebt).dividedBy('1e18');
            const pending = new BigNumber(user.amount).dividedBy('1e18').multipliedBy(sushiPerShare).minus(sushiDebt);
        
            const harvested = new BigNumber(user.sushiHarvested);
            const locked = pending.plus(harvested).multipliedBy(2);
            return locked;
        }
    }
    throw new Error(`Liquidity Provider Wallet Address ${holderAddress} with MasterChef Farm Pool Id ${farmPoolId} not found`)
}

const OneInchTokenAddress = '0x111111111117dc0aa78b770fa6a738034120c302';
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
            const farm = getContract(farmAddress, oneInchFarmAbi, web3);
            poolDataTxs.push(pool.methods.balanceOf(farmAddress).call());
            poolDataTxs.push(farm.methods.totalSupply().call());
            poolDataTxs.push(farm.methods.balanceOf(holderInfo).call());
            poolDataTxs.push(farm.methods.earned(holderInfo).call());
            poolDataTxs.push(getTokenData(OneInchTokenAddress, erc20Abi, web3, holderInfo));
        }
    }
    const poolDataRes = await Promise.all(poolDataTxs);

    const totalLp = new BigNumber(poolDataRes[0])
    const holderLp = new BigNumber(isAddress(holderInfo) ? poolDataRes[3] : holderInfo);
    const lpTokenDecimals = poolDataRes[1];
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

    const oneInchRewardTokenData = poolDataRes[8];
    if (isAddress(holderInfo) && isAddress(farmAddress)) {
        oneInchRewardTokenData.ClaimedBalanceLeftInWallet = oneInchRewardTokenData.Balance;
        delete oneInchRewardTokenData.Balance;
        oneInchRewardTokenData.UnclaimedUnlockedBalance = bigToNumber(new BigNumber(poolDataRes[7]), oneInchRewardTokenData);
    }
    return newPoolData(poolAddress, holderInfo, totalLp, holderLp, lpTokenDecimals, positionValues, farmAddress, indirectFranctionOfPool, oneInchRewardTokenData);    
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
