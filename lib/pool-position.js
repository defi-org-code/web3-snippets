import BigNumber from 'bignumber.js';
import { balancerPoolAbi } from './abi/balancer-pool';
import { erc20Abi } from './abi/erc20';
import { bigToNumber, getContract, getTokenData } from './eth-helpers';

export const PoolType = {
    BALANCER: 'BALANCER'
}

export async function lpPositionStatus({holderAddress, poolType, poolAddress, web3}) {
    let res = undefined
    switch(poolType) {
        case PoolType.BALANCER:
            res = await getBalancerPoolData(holderAddress, poolAddress, web3);
            break;
        default:
            throw new Error(`lpPositionStatus: Pool ${poolType} not recognized`);
    }
    await fillTokenValues(res.poolData, res.balances, web3);
    return res.poolData;
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
        pool.methods.getFinalTokens().call(),
        pool.methods.decimals().call()
    ];
    const poolDataRes = await Promise.all(poolDataTxs);
 
    const totalLp = new BigNumber(poolDataRes[0]), lpBalance = new BigNumber(poolDataRes[1]);
    const fractionOfPool = lpBalance.dividedBy(totalLp);
    const balances = await Promise.all(poolDataRes[2].map(tokenAddr => pool.methods.getBalance(tokenAddr).call().then(v => {return new BigNumber(v).multipliedBy(fractionOfPool)})));
    const lpTokenData = { Decimals: poolDataRes[3]};

    return { 
        poolData: newPoolData(poolAddress, bigToNumber(totalLp, lpTokenData), holderAddress, bigToNumber(lpBalance, lpTokenData), poolDataRes[2]),
        balances
    };      
}

async function fillTokenValues(poolData, balances, web3) {
    const tokenTxs = [];
    for(let i = 0;i < poolData.PositionValue.length;i++) {
        tokenTxs.push(getTokenData(poolData.PositionValue[i], erc20Abi, web3).then(r => {r.Balance = bigToNumber(balances[i], r); return r}));
    }
    poolData.PositionValue = await Promise.all(tokenTxs);
}