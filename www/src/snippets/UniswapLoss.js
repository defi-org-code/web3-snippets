import React, { useState } from "react";
import { Container, Segment, Form } from "semantic-ui-react";
import { lpPosition } from "web3-snippets/uniswap";
import { useApiKeys } from "../ApiKeys";

function Snippet() {
  const { web3 } = useApiKeys();
  const [input, setInput] = useState({});
  const [result, setResult] = useState();
  const [loading, setLoading] = useState(false);
  const handleChange = (_e, { name, value }) => setInput({ ...input, [name]: value });
  const handleSubmit = async () => {
    const { fromBlock, toBlock, pair, lp } = input;
    setLoading(true);
    const result = await lpPosition({ web3, fromBlock, toBlock, pair, lp });
    setResult(result);
    setLoading(false);
  };
  return (
    <div>
      <h2>Uniswap Impermanent Loss</h2>
      <br />
      <Container textAlign="left">
        <Segment textAlign="left" secondary style={{ width: "50vw", margin: "auto" }}>
          <Form loading={loading} onSubmit={handleSubmit} spellcheck="false">
            <Form.Input
              label="Uniswap Pair Contract Address"
              name="pair"
              placeholder="0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852"
              onChange={handleChange}
            />
            <Form.Input
              label="Liquidity Provider Wallet Address"
              name="lp"
              placeholder="0x533D94255aDABE5F9AC7d6755ebCe1e93a00AfC7"
              onChange={handleChange}
            />
            <Form.Group widths="equal">
              <Form.Input fluid label="From Block" name="fromBlock" value="0" onChange={handleChange} />
              <Form.Input fluid label="To Block" name="toBlock" value="latest" onChange={handleChange} />
            </Form.Group>
            <Form.Button primary>Submit</Form.Button>
          </Form>
        </Segment>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </Container>
    </div>
  );
}

export default Snippet;
