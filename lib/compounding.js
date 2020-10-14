// calculate the profit from compounding an investment in a certain rate
// amount - number of tokens being invested (before compounding)
// apy - annual return (without compounding) in percent (ie. 19.2)
// days - how many days the investment will remain active (ie. 7.4)
// cpCost - cost of every compound operations in number of tokens like amount
// cpRateMinutes - every how many minutes do we compound
export function compoundingSim({ amount, apy, days, cpCost, cpRateMinutes }) {
  const res = {
    ResultWithoutCompound: 0,
    ResultWithCompound: 0,
    CompoundingProfit: 0,
    CompoundingProfitPercent: 0,
  };

  amount = parseFloat(amount);
  apy = parseFloat(apy);
  days = parseFloat(days);
  cpCost = parseFloat(cpCost);
  cpRateMinutes = parseFloat(cpRateMinutes);

  res.ResultWithoutCompound = amount + amount * apy/100 * days/365;

  let amountSoFar = amount;
  let minutesSoFar = 0;
  while (minutesSoFar + cpRateMinutes < days*24*60) {
    minutesSoFar += cpRateMinutes;
    amountSoFar += amountSoFar * apy/100 * cpRateMinutes/24/60/365;
    amountSoFar -= cpCost;
  }
  const remainingMinutes = days*24*60 - minutesSoFar;
  amountSoFar += amountSoFar * apy/100 * remainingMinutes/24/60/365;
  res.ResultWithCompound = amountSoFar;

  res.CompoundingProfit = res.ResultWithCompound - res.ResultWithoutCompound;
  res.CompoundingProfitPercent = res.CompoundingProfit / res.ResultWithoutCompound * 100;

  return res;
}