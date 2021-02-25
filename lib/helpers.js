import fetch from "node-fetch";

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

export async function fetchJsonPost(url, dataStr) {
  const res = await fetch(url,
    {
      method: 'post',
      body:    dataStr,
      headers: { 'Content-Type': 'application/json' },
    });
  return await res.json();
}
