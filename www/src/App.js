import React from "react";
import { HashRouter, Route, Link } from "react-router-dom";
import { Menu } from "semantic-ui-react";
import { getWeb3 } from "web3-snippets/helpers";
import "./App.css";
import ApiKeysContext from "./ApiKeys";
import CheckContract from "./snippets/CheckContract";
import CheckApprove from "./snippets/CheckApprove";

function App() {
  return (
    <ApiKeysContext.Provider
      value={{
        web3: getWeb3("https://mainnet.infura.io/v3/353c79e2252d4c3ba0ffe9feb597d398"),
        ethscn: "H9Q2BDA55J85PISTNG8BDM5IKD4MGTUVW4",
      }}
    >
      <HashRouter basename="/">
        <div className="App">
          <Menu inverted>
            <Link to="/check-contract">
              <Menu.Item name="Check Contract" />
            </Link>
            <Link to="/check-approve">
              <Menu.Item name="Check Approve" />
            </Link>
          </Menu>
          <Route exact path="/check-contract" component={CheckContract} />
          <Route path="/check-approve" component={CheckApprove} />
        </div>
      </HashRouter>
    </ApiKeysContext.Provider>
  );
}

export default App;
