import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router
} from "react-router-dom";
import Layout from "./components/Layout";
import { esStoreFactory } from "./stores/elastic";

export const AppContext = React.createContext({})

export default (props) => {
  const [state, setState] = useState({
    esIndex: "mvk-default",
    selectedFiles: [],
    esURL: localStorage.getItem('esURL'),
    esConnected: false
  });

  const esStore = esStoreFactory(state.esURL)

  const setSelectedIndex = indexName => {
    if (indexName) {
      setState({ ...state, esIndex: indexName })
    }
  }

  const toggleFile = file => {
    setState(s => {
      let { selectedFiles } = s;

      if (selectedFiles.includes(file)) {
        selectedFiles = selectedFiles.filter(e => e !== file)
      } else {
        selectedFiles = [...selectedFiles, file]
      }

      return {...state, selectedFiles}
    });
  }

  const isValidHttpUrl = string => {
    let url;

    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
  }

  const testESConnection = async url => {
    if (isValidHttpUrl(url))
    {
      if (await esStore.canConnect(url)) {
        setState({ ...state, esURL: url, esConnected: true })
        localStorage.setItem('esURL', url)
        console.log('Connected to ES at: ' + url)
      } else {
        console.warn('Unable to connect to: ' + url)
        setState({ ...state, esConnected: false })
      }
    } else {
      console.debug('Invalid URL: ' + url)
    }
  }

  useEffect(() => { testESConnection(state.esURL) }, [])

  return (
    <AppContext.Provider value={{
      esStore,
      esIndex: state.esIndex,
      setSelectedIndex,
      selectedFiles: state.selectedFiles,
      toggleFile,
      esURL: state.esURL,
      testESConnection,
      esConnected: state.esConnected
    }}>
      <Router>
        <Layout />
      </Router>
    </AppContext.Provider>
  )
}