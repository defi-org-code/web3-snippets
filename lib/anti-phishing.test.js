import Web3 from "web3";

import { checkContract, checkApprove } from "./anti-phishing";

describe("Anti Phishing", () => {
  const web3 = new Web3("https://mainnet.infura.io/v3/353c79e2252d4c3ba0ffe9feb597d398");

  it("checkContract", async () => {
    const res = await checkContract({
      web3,
      ethscn: "H9Q2BDA55J85PISTNG8BDM5IKD4MGTUVW4",
      address: "0xbD17B1ce622d73bD438b9E658acA5996dc394b0d",
      hexData:
        "0x441a3e7000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000",
    });
    console.log(JSON.stringify(res, null, 2));
  });

  it("checkApprove", async () => {
    const res = await checkApprove({
      web3,
      ethscn: "H9Q2BDA55J85PISTNG8BDM5IKD4MGTUVW4",
      hexData:
        "0x095ea7b3000000000000000000000000bd17b1ce622d73bd438b9e658aca5996dc394b0dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    });
    console.log(JSON.stringify(res, null, 2));
  });
});
