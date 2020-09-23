import React, { useState } from "react";
import { Container, Segment, Form } from "semantic-ui-react";
import { checkContract } from "web3-snippets/anti-phishing";
import { useApiKeys } from "../ApiKeys";

function Snippet() {
  const { web3, ethscn } = useApiKeys();
  const [input, setInput] = useState({});
  const [result, setResult] = useState();
  const [loading, setLoading] = useState(false);
  const handleChange = (_e, { name, value }) => setInput({ ...input, [name]: value });
  const handleSubmit = async () => {
    const { address, hexData } = input;
    setLoading(true);
    const result = await checkContract({ web3, ethscn, address, hexData });
    setResult(result);
    setLoading(false);
  };
  return (
    <div>
      <h2>Check Contract</h2>
      <br />
      <Container textAlign="left">
        <Segment textAlign="left" secondary style={{ width: "50vw", margin: "auto" }}>
          <Form loading={loading} onSubmit={handleSubmit} spellcheck="false">
            <Form.Input
              label="Contract Address"
              name="address"
              placeholder="0xbD17B1ce622d73bD438b9E658acA5996dc394b0d"
              onChange={handleChange}
            />
            <Form.TextArea
              label="Method Call Hex Data"
              name="hexData"
              placeholder="0x095ea7b3000000000000000000000000..."
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
