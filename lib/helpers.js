import fetch from "node-fetch";
import Web3 from "web3";

export function getWeb3(endpoint) {
  return new Web3(endpoint);
}

export async function sleep(milis) {
  return new Promise((resolve) => setTimeout(resolve, milis));
}

export function daysAgo(timestampSec) {
  const secDelta = new Date().getTime() / 1000 - parseInt(timestampSec);
  return Math.round((10 * secDelta) / (24 * 60 * 60)) / 10;
}

export function timestampNow() {
  return Math.round(new Date().getTime() / 1000);
}

export async function fetchJson(url) {
  const res = await fetch(url);
  return await res.json();
}
