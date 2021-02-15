import React, { useState } from "react";
import { Container, Segment, Form } from "semantic-ui-react";
import { lpPositionStatus, PoolType } from "web3-snippets/pool-position";
import { useApiKeys } from "../ApiKeys";
const poolTypeOptions = [
  {
    key: 'Balancer',
    text: 'Balancer',
    value: PoolType.BALANCER
  },
  {
    key: 'Uniswap',
    text: 'Uniswap',
    value: PoolType.UNISWAP
  },
  {
    key: 'Sushiswap',
    text: 'Sushiswap',
    value: PoolType.SUSHISWAP
  },
  {
    key: '1Inch',
    text: '1Inch',
    value: PoolType.ONEINCH
  }
];


function Snippet() {
  const { web3 } = useApiKeys();
  const [input, setInput] = useState({});
  const [result, setResult] = useState();
  const [loading, setLoading] = useState(false);
  const handleChange = (_e, { name, value }) => setInput({ ...input, [name]: value });
  const handleSubmit = async () => {
    const { poolAddress, holderAddress, poolType } = input;
    setLoading(true);
    const result = await lpPositionStatus({ holderAddress, poolType, poolAddress, web3 });
    setResult(result);
    setLoading(false);
  };
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
              label="Liquidity Provider Wallet Address"
              name="holderAddress"
              placeholder="0x49a2dcc237a65cc1f412ed47e0594602f6141936"
              onChange={handleChange}
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
