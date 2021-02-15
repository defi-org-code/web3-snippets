import Web3 from "web3";

import { lpPositionStatus, PoolType } from "./pool-position";

describe("Pool Position", () => {
  const web3 = new Web3("https://mainnet.infura.io/v3/353c79e2252d4c3ba0ffe9feb597d398");

  it("balancer", async () => {
    const res = await lpPositionStatus({
      web3,
      holderAddress: '0x49a2dcc237a65cc1f412ed47e0594602f6141936', 
      poolType: PoolType.BALANCER,
      poolAddress: '0x1eff8af5d577060ba4ac8a29a13525bb0ee2a3d5'
    });
    console.log(JSON.stringify(res, null, 2));
  });

  it("uniswap", async () => {
    const res = await lpPositionStatus({
      web3,
      holderAddress: '0x92c96306289a7322174d6e091b9e36b14210e4f5', 
      poolType: PoolType.UNISWAP,
      poolAddress: '0xbb2b8038a1640196fbe3e38816f3e67cba72d940'
    });
    console.log(JSON.stringify(res, null, 2));
  });

  it("sushiswap", async () => {
    const res = await lpPositionStatus({
      web3,
      holderAddress: '0xE11fc0B43ab98Eb91e9836129d1ee7c3Bc95df50', 
      poolType: PoolType.SUSHISWAP,
      poolAddress: '0x795065dCc9f64b5614C407a6EFDC400DA6221FB0'
    });
    console.log(JSON.stringify(res, null, 2));
  });

  it("oneinch-one-token", async () => {
    const res = await lpPositionStatus({
      web3,
      holderAddress: '0x30fdb20840b2356bfda4055641417e1bc26da261', 
      poolType: PoolType.ONEINCH,
      poolAddress: '0xbBa17b81aB4193455Be10741512d0E71520F43cB'
    });
    console.log(JSON.stringify(res, null, 2));
  });

  it.only("oneinch-two-token", async () => {
    const res = await lpPositionStatus({
      web3,
      holderAddress: '0xc2a4b640dd4e591559fcdeb8566a05c23237d9e6', 
      poolType: PoolType.ONEINCH,
      poolAddress: '0x1f629794B34FFb3B29FF206Be5478A52678b47ae'
    });
    console.log(JSON.stringify(res, null, 2));
  });

});
