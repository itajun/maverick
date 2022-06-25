import React from "react";
import { esStoreFactory } from "./stores/elastic";
import Layout from "./components/Layout";

const defaultContext = {
  esStore: esStoreFactory("http://10.10.12.41:9200"),
  esIndex: "maverick-default"
}

export const AppContext = React.createContext(defaultContext)

export default (props) =>
  <AppContext.Provider value={ defaultContext }>
    <Layout />
  </AppContext.Provider>