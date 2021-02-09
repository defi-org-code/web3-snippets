import Web3 from "web3";

import { pancakeLpPosition } from "./pancake";

describe.only("Pancake", () => {
  const bscWeb3 = new Web3('https://bsc-dataseed3.defibit.io/');

  it("lpPosition", async () => {
    const res = await pancakeLpPosition({
      bscWeb3,
      fromBlock: 0,
      toBlock: "latest",
      pair: "0x1b96b92314c44b159149f7e0303511fb2fc4774f",
      lp: "0x2Da255c76C373Bab17c7dF527aa2748099266061",
    });
    console.log(JSON.stringify(res, null, 2));
  });
});
