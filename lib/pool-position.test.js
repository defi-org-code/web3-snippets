import Web3 from "web3";

import { lpPositionStatus, PoolType } from "./pool-position";

describe("Pool Position", () => {
  const web3 = new Web3("https://mainnet.infura.io/v3/353c79e2252d4c3ba0ffe9feb597d398");

  it("balancer", async () => {
    const res = await lpPositionStatus(
      '0x49a2dcc237a65cc1f412ed47e0594602f6141936', 
      PoolType.BALANCER,
      '0x1eff8af5d577060ba4ac8a29a13525bb0ee2a3d5',
      web3
    );
    console.log(JSON.stringify(res, null, 2));
  });

  it("uniswap", async () => {
    const res = await lpPositionStatus(
      '0x92c96306289a7322174d6e091b9e36b14210e4f5', 
      PoolType.UNISWAP,
      '0xbb2b8038a1640196fbe3e38816f3e67cba72d940',
      web3
    );
    console.log(JSON.stringify(res, null, 2));
  });

  describe("Sushiswap", () => {
    it("direct", async () => {
      const res = await lpPositionStatus(
        '0xE11fc0B43ab98Eb91e9836129d1ee7c3Bc95df50', 
        PoolType.SUSHISWAP,
        '0x795065dCc9f64b5614C407a6EFDC400DA6221FB0',
        web3
      );
      console.log(JSON.stringify(res, null, 2));
    });

    it("with lp tokens", async () => {
      const res = await lpPositionStatus(
        '9259903338226', 
        PoolType.SUSHISWAP,
        '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
        web3,
      );
      console.log(JSON.stringify(res, null, 2));
    });

    it("with farm", async () => {
      const res = await lpPositionStatus(
        '0x2a2f17DB6F5A9dFf54CA0594046635978c4bD396', 
        PoolType.SUSHISWAP,
        '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
        web3,
        '1'
      );
      console.log(JSON.stringify(res, null, 2));
    });
  });

  describe("1inch", () => {
    it("one-token", async () => {
      const res = await lpPositionStatus(
        '0x30fdb20840b2356bfda4055641417e1bc26da261', 
        PoolType.ONEINCH,
        '0xbBa17b81aB4193455Be10741512d0E71520F43cB',
        web3,
      );
      console.log(JSON.stringify(res, null, 2));
    });

    it("two-token", async () => {
      const res = await lpPositionStatus(
        '0xc2a4b640dd4e591559fcdeb8566a05c23237d9e6', 
        PoolType.ONEINCH,
        '0x1f629794B34FFb3B29FF206Be5478A52678b47ae',
        web3,
      );
      console.log(JSON.stringify(res, null, 2));
    });

    it("lp-value-given", async () => {
      const res = await lpPositionStatus(
        '12002172481476007751', 
        PoolType.ONEINCH,
        '0xbBa17b81aB4193455Be10741512d0E71520F43cB',
        web3,
      );
      console.log(JSON.stringify(res, null, 2));
    });

    it("farm-given", async () => {
      const res = await lpPositionStatus(
        '0x2a2f17DB6F5A9dFf54CA0594046635978c4bD396', 
        PoolType.ONEINCH,
        '0xb4dB55a20E0624eDD82A0Cf356e3488B4669BD27',
        web3,
        '0xc7c42eccAc0D4Bb790a32Bc86519aC362e01d388'
      );
      console.log(JSON.stringify(res, null, 2));
    });

  });

});
