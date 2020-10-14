import { compoundingSim } from "./compounding";

describe.only("Compounding", () => {
  it("sanity no compound", () => {
    const res = compoundingSim({
      amount: 100000,
      apy: 30,
      days: 7,
      cpCost: 0,
      cpRateMinutes: 100*24*60
    });
    console.log(JSON.stringify(res, null, 2));
  });

  it("sanity no apy", () => {
    const res = compoundingSim({
      amount: 100000,
      apy: 0,
      days: 7,
      cpCost: 1,
      cpRateMinutes: 60
    });
    console.log(JSON.stringify(res, null, 2));
  });

  it("sanity no compound cost", () => {
    const res = compoundingSim({
      amount: 100000,
      apy: 30,
      days: 7,
      cpCost: 0,
      cpRateMinutes: 60
    });
    console.log(JSON.stringify(res, null, 2));
  });

  it("example", () => {
    const res = compoundingSim({
      amount: 11706,
      apy: 600,
      days: 7,
      cpCost: 0.1143,
      cpRateMinutes: 60
    });
    console.log(JSON.stringify(res, null, 2));
  });
});
