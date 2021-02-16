import React, { useState } from "react";
import { Container, Segment, Form } from "semantic-ui-react";
import { lpPositionStatus, PoolType } from "web3-snippets/pool-position";
import { useApiKeys } from "../ApiKeys";
const poolTypeOptions = [
  {
    key: 'Balancer',
    text: 'Balancer',
    value: PoolType.BALANCER,
    farmLabel: 'Farm Address'
  },
  {
    key: 'Uniswap',
    text: 'Uniswap',
    value: PoolType.UNISWAP,
    farmLabel: 'Farm Address'
  },
  {
    key: 'Sushiswap',
    text: 'Sushiswap',
    value: PoolType.SUSHISWAP,
    farmLabel: 'MasterChef Farm Pool Id (optional)'
  },
  {
    key: '1Inch',
    text: '1Inch',
    value: PoolType.ONEINCH,
    farmLabel: 'Farming Contract Address (optional)'
  }
];

function Snippet() {
  const { web3 } = useApiKeys();
  const [input, setInput] = useState({});
  const [result, setResult] = useState();
  const [loading, setLoading] = useState(false);
  const [hideFarming, setHideFarming] = useState(true);
  const [farmLabel, setFarmLabel] = useState(poolTypeOptions[0].farmLabel)
  const handleChange = (_e, { name, value }) => {setInput({ ...input, [name]: value }); updateVisuals(name, value);};
  const updateVisuals = (name, value) => {
    let { holderInfo, poolType } = input;
    if (name === 'poolType') {
      poolType = value;
    } else if (name === 'holderInfo') {
      holderInfo = value;
    }
    const pool = findPoolType(poolType);
    setFarmLabel(pool.farmLabel)
    if (holderInfo && holderInfo.startsWith('0x') && (pool.value === PoolType.ONEINCH || pool.value === PoolType.SUSHISWAP)) {
      setHideFarming(false);
    } else {
      setHideFarming(true);
    }

  };
  const handleSubmit = async () => {
    const { poolAddress, holderInfo, poolType, farmAddress } = input;
    setLoading(true);
    const result = await lpPositionStatus(holderInfo, poolType, poolAddress, web3, farmAddress);
    setResult(result);
    setLoading(false);
  };
  const findPoolType = (poolType) => {
    for(const option of poolTypeOptions) {
      if (option.value === poolType) {
        return option;
      }
    }
    return poolTypeOptions[0];
  }
  return (
    <div>
      <h2>Pool Position Status</h2>
      <br />
      <Container textAlign="left">
        <Segment textAlign="left" secondary style={{ width: "50vw", margin: "auto" }}>
          <Form loading={loading} onSubmit={handleSubmit} spellcheck="false">
            <Form.Select
              label="Pool Type"
              name="poolType"
              options={poolTypeOptions}
              onChange={handleChange}
            />
            <Form.Input
              label="Pool Contract Address"
              name="poolAddress"
              placeholder="0x1eff8af5d577060ba4ac8a29a13525bb0ee2a3d5"
              onChange={handleChange}
            />
            <Form.Input
              label="Liquidity Provider Wallet Address Or Big Number of LP Tokens"
              name="holderInfo"
              placeholder="0x49a2dcc237a65cc1f412ed47e0594602f6141936"
              onChange={handleChange}
            />
            <Form.Input
              label={farmLabel}
              name="farmAddress"
              placeholder="0xe22f6a5dd9e491dfab49faefdb32d01aaf99703e"
              onChange={handleChange}
              disabled={hideFarming}
            />
            <Form.Button primary>Submit</Form.Button>
          </Form>
        </Segment>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </Container>
    </div>
  );
}

export default Snippet;
