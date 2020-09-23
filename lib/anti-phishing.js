import _ from "lodash";
import BN from "bn.js";
import InputDataDecoder from "ethereum-input-data-decoder";
import { fetchJson, daysAgo, timestampNow, sleep } from "./helpers";

const MIN_CONTRACT_CODE_SIZE = 20;

// takes a contract and method call and performs due diligence over both to protect against phishing
// web3 - initialized web3 instance used for read only
// ethscn - etherscan.io API key (string)
// address - the address of the contract (0x string)
// hexData - the encoded input data to the transaction (0x string)
export async function checkContract({ web3, ethscn, address, hexData }) {
  const res = {
    Address: address,
    PublishedAbi: false,
    SourceCodeUrl: "",
    DeployedDaysAgo: 0,
    NumTx: 0,
    NumTxHaveMore: false,
    NumTxInLast24Hours: 0,
    TxListUrl: "",
    TxStats: {},
    Tx100DaysAgo: 0,
    Tx1000DaysAgo: 0,
    EthSpentOnGas: 0,
    DifferentAddresses: 0,
    MethodCall: {},
  };

  // abi
  let abi;
  const abiReq = await fetchJson(
    `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${ethscn}`
  );
  if (abiReq.status === "1" && abiReq.result) {
    abi = JSON.parse(abiReq.result);
    res.PublishedAbi = true;
    res.SourceCodeUrl = `https://etherscan.io/address/${address}#code`;
  }

  // transactions
  res.TxListUrl = `https://etherscan.io/txs?a=${address}`;
  const firstTxs = await fetchJson(
    `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${ethscn}`
  );
  const lastTxs = await fetchJson(
    `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${ethscn}`
  );
  if (
    firstTxs.status === "1" &&
    firstTxs.result &&
    firstTxs.result.length > 0 &&
    lastTxs.status === "1" &&
    lastTxs.result &&
    lastTxs.result.length > 0
  ) {
    if (firstTxs.result[0].to === "" && firstTxs.result[0].input.length > MIN_CONTRACT_CODE_SIZE) {
      res.DeployedDaysAgo = daysAgo(firstTxs.result[0].timeStamp);
    }
    if (
      _.some(firstTxs.result, (tx) => tx.to !== "" && tx.to !== address.toLowerCase()) ||
      _.some(firstTxs.result, (tx) => tx.to !== "" && tx.to !== address.toLowerCase())
    ) {
      throw new Error("Address is not destination of all transactions, is this a contract?");
    }
    if (firstTxs.result.length < 10000 && lastTxs.result.length < 10000) {
      res.NumTx = firstTxs.result.length;
      res.NumTxHaveMore = false;
    } else {
      res.NumTx = 10000;
      res.NumTxHaveMore = true;
    }
    if (firstTxs.result.length > 100) {
      res.Tx100DaysAgo = daysAgo(firstTxs.result[100].timeStamp);
    }
    if (firstTxs.result.length > 1000) {
      res.Tx1000DaysAgo = daysAgo(firstTxs.result[1000].timeStamp);
    }
    const before24h = timestampNow() - 24 * 60 * 60;
    res.NumTxInLast24Hours = _.reduce(
      lastTxs.result,
      (sum, tx) => sum + (parseInt(tx.timeStamp) > before24h ? 1 : 0),
      0
    );
    res.EthSpentOnGas = _.reduce(
      lastTxs.result,
      (sum, tx) => sum + parseInt(tx.gasUsed) * (parseInt(tx.gasPrice) / 1e18),
      0
    );
    res.DifferentAddresses = _.uniqBy(lastTxs.result, (tx) => tx.from.toLowerCase()).length;
    res.EthSpentOnGas = Math.round(res.EthSpentOnGas * 1000) / 1000;
    if (abi) res.TxStats = getStatsPerMethod(abi, lastTxs.result);
  }

  // hex data
  if (hexData && abi) res.MethodCall = await decodeHexData(web3, ethscn, abi, hexData);
  else delete res.MethodCall;

  return res;
}

// takes input for an ERC20 Approve action and performs due diligence over it to protect against phishing
// web3 - initialized web3 instance used for read only
// ethscn - etherscan.io API key (string)
// hexData - the encoded input data to the transaction (0x string)
export async function checkApprove({ web3, ethscn, hexData }) {
  const res = {
    MethodCall: {},
  };

  const abi = [
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];
  res.MethodCall = await decodeHexData(web3, ethscn, abi, hexData);

  return res;
}

function getStatsPerMethod(abi, txs) {
  let total = 0;
  const sumPerMethod = {};
  const decoder = new InputDataDecoder(abi);
  for (const tx of txs) {
    const decoded = decoder.decodeData(tx.input);
    if (!decoded.method) continue;
    if (!sumPerMethod[decoded.method]) sumPerMethod[decoded.method] = 0;
    sumPerMethod[decoded.method]++;
    total++;
    if (total > 1000) break;
  }
  return _.mapValues(sumPerMethod, (sum) => Math.round((100 * 100 * sum) / total) / 100);
}

async function decodeHexData(web3, ethscn, abi, hexData) {
  const decoder = new InputDataDecoder(abi);
  const decoded = decoder.decodeData(hexData);
  const res = {
    Method: decoded.method,
    Args: [],
  };
  for (let i = 0; i < decoded.names.length; i++) {
    const name = decoded.names[i];
    const type = decoded.types[i];
    const rawValue = decoded.inputs[i];
    let value = rawValue.toString();
    if (
      type === "uint256" &&
      rawValue.eq(new BN("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", 16))
    ) {
      value = "unlimited";
    }
    if (type === "address") {
      value = web3.utils.toChecksumAddress(value);
    }
    res.Args[i] = {
      Name: name,
      Type: type,
      Value: value,
    };
    if (type === "address" && (await isContract(web3, value))) {
      await sleep(1100); // don't stress etherscan api
      res.Args[i].Contract = await checkContract({
        web3,
        ethscn,
        address: value,
      });
    }
  }
  return res;
}

async function isContract(web3, address) {
  const res = await web3.eth.getCode(address);
  return res.length > MIN_CONTRACT_CODE_SIZE;
}
