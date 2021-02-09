import React from "react";
import { HashRouter, Route, Link } from "react-router-dom";
import { Menu } from "semantic-ui-react";
import { getWeb3 } from "web3-snippets/helpers";
import "./App.css";
import ApiKeysContext from "./ApiKeys";
import CheckContract from "./snippets/CheckContract";
import CheckApprove from "./snippets/CheckApprove";
import UniswapLoss from "./snippets/UniswapLoss";
import Compounding from "./snippets/Compounding";
import PancakeLoss from "./snippets/PancakeLoss";

function App() {
  return (
    <ApiKeysContext.Provider
      value={{
        web3: getWeb3("https://mainnet.infura.io/v3/353c79e2252d4c3ba0ffe9feb597d398"),
        bscWeb3: getWeb3("https://bsc-dataseed.binance.org/"),
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
            <Link to="/uniswap-loss">
              <Menu.Item name="Uniswap Loss" />
            </Link>
            <Link to="/compounding">
              <Menu.Item name="Compounding" />
            </Link>
            <Link to="/pancake-loss">
              <Menu.Item name="Pancake Loss" />
            </Link>
          </Menu>
          <Route exact path="/check-contract" component={CheckContract} />
          <Route path="/check-approve" component={CheckApprove} />
          <Route path="/uniswap-loss" component={UniswapLoss} />
          <Route path="/compounding" component={Compounding} />
          <Route path="/pancake-loss" component={PancakeLoss} />
        </div>
      </HashRouter>
    </ApiKeysContext.Provider>
  );
}

export default App;
