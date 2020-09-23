import React, { useContext } from "react";

const ApiKeysContext = React.createContext({});

export function useApiKeys() {
  return useContext(ApiKeysContext);
}

export default ApiKeysContext;
