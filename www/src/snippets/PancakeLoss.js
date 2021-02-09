import React, { useState } from "react";
import { Container, Segment, Form } from "semantic-ui-react";
import { pancakeLpPosition } from "web3-snippets/pancake";
import { useApiKeys } from "../ApiKeys";

function Snippet() {
  const { bscWeb3 } = useApiKeys();
  const [input, setInput] = useState({});
  const [result, setResult] = useState();
  const [loading, setLoading] = useState(false);
  const handleChange = (_e, { name, value }) => setInput({ ...input, [name]: value });
  const handleSubmit = async () => {
    const { fromBlock, toBlock, pair, lp } = input;
    setLoading(true);
    const result = await pancakeLpPosition({ bscWeb3, fromBlock, toBlock, pair, lp });
    setResult(result);
    setLoading(false);
  };
  return (
    <div>
      <h2>Pancake Impermanent Loss</h2>
      <br />
      <Container textAlign="left">
        <Segment textAlign="left" secondary style={{ width: "50vw", margin: "auto" }}>
          <Form loading={loading} onSubmit={handleSubmit} spellcheck="false">
            <Form.Input
              label="Pancake Pair Contract Address"
              name="pair"
              placeholder="0x1b96b92314c44b159149f7e0303511fb2fc4774f"
              onChange={handleChange}
            />
            <Form.Input
              label="Liquidity Provider Wallet Address"
              name="lp"
              placeholder="0x1f38c8bdd9cb174599574b6c8fadffd1fd987c85"
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
