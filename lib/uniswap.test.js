import Web3 from "web3";

import { lpPosition } from "./uniswap";

describe.only("Uniswap", () => {
  const web3 = new Web3("https://mainnet.infura.io/v3/353c79e2252d4c3ba0ffe9feb597d398");

  it("lpPosition", async () => {
    const res = await lpPosition({
      web3,
      fromBlock: 0,
      toBlock: "latest",
      pair: "0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852",
      lp: "0x533D94255aDABE5F9AC7d6755ebCe1e93a00AfC7",
    });
    console.log(JSON.stringify(res, null, 2));
  });
});
