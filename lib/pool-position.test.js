import Web3 from "web3";

import { lpPositionStatus, PoolType } from "./pool-position";

describe.only("Pool Position", () => {
  const web3 = new Web3("https://mainnet.infura.io/v3/353c79e2252d4c3ba0ffe9feb597d398");

  it("lpPositionStatus", async () => {
    const res = await lpPositionStatus({
      web3,
      holderAddress: '0x49a2dcc237a65cc1f412ed47e0594602f6141936', 
      poolType: PoolType.BALANCER,
      poolAddress: '0x1eff8af5d577060ba4ac8a29a13525bb0ee2a3d5'
    });
    console.log(JSON.stringify(res, null, 2));
  });
});
