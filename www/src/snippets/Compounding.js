import React, { useState } from "react";
import { Container, Segment, Form } from "semantic-ui-react";
import { compoundingSim } from "web3-snippets/compounding";

function Snippet() {
  const [input, setInput] = useState({});
  const [result, setResult] = useState();
  const [loading, setLoading] = useState(false);
  const handleChange = (_e, { name, value }) => setInput({ ...input, [name]: value });
  const handleSubmit = () => {
    const { amount, apy, days, cpCost, cpRateMinutes } = input;
    setLoading(true);
    const result = compoundingSim({ amount, apy, days, cpCost, cpRateMinutes });
    setResult(result);
    setLoading(false);
  };
  return (
    <div>
      <h2>Compounding Profit Calculator</h2>
      <br />
      <Container textAlign="left">
        <Segment textAlign="left" secondary style={{ width: "50vw", margin: "auto" }}>
          <Form loading={loading} onSubmit={handleSubmit} spellcheck="false">
            <Form.Input
              label="Initial Amount (in tokens)"
              name="amount"
              placeholder="100000"
              onChange={handleChange}
            />
            <Form.Group widths="equal">
              <Form.Input fluid label="APY (%)" name="apy" placeholder="30" onChange={handleChange} />
              <Form.Input fluid label="Num Days Investing" name="days" placeholder="7" onChange={handleChange} />
            </Form.Group>
            <Form.Group widths="equal">
              <Form.Input fluid label="Cost of Compound Operation (in tokens)" name="cpCost" placeholder="1" onChange={handleChange} />
              <Form.Input fluid label="Minutes Between Compounds" name="cpRateMinutes" placeholder="60" onChange={handleChange} />
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
