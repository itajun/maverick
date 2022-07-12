import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Layout from './components/Layout';
import { esStoreFactory } from './stores/elastic';
import { ThemeProvider, createTheme } from '@mui/material/styles';

export const AppContext = React.createContext({});

const App = () => {
    const [state, setState] = useState({
        esIndex: 'mvk-default',
        selectedFiles: [],
        esURL: localStorage.getItem('esURL'),
        esConnected: false,
        themeMode: localStorage.getItem('themeMode')
            ? localStorage.getItem('themeMode')
            : 'light',
        drawerOpen: true,
    });

    const esStore = esStoreFactory(state.esURL);

    const setSelectedIndex = (indexName) => {
        if (indexName) {
            setState({ ...state, esIndex: indexName });
        }
    };

    const toggleThemeMode = () => {
        setState((s) => {
            const mode = s.themeMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeMode', mode);
            return { ...state, themeMode: mode };
        });
    };

    const toggleDrawer = () => {
        setState((s) => {
            return { ...state, drawerOpen: !s.drawerOpen };
        });
    };

    const darkTheme = createTheme(
        {
            palette: {
                mode: state.themeMode,
            },
        },
        [state.themeMode]
    );

    const toggleFile = (file) => {
        setState((s) => {
            let { selectedFiles } = s;

            if (selectedFiles.includes(file)) {
                selectedFiles = selectedFiles.filter((e) => e !== file);
            } else {
                selectedFiles = [...selectedFiles, file];
            }

            return { ...state, selectedFiles };
        });
    };

    const isValidHttpUrl = (string) => {
        let url;

        try {
            url = new URL(string);
        } catch (_) {
            return false;
        }

        return url.protocol === 'http:' || url.protocol === 'https:';
    };

    const testESConnection = async (url) => {
        if (isValidHttpUrl(url)) {
            if (await esStore.canConnect(url)) {
                setState({ ...state, esURL: url, esConnected: true });
                localStorage.setItem('esURL', url);
                console.debug('Connected to ES at: ' + url);
            } else {
                console.warn('Unable to connect to: ' + url);
                setState({ ...state, esConnected: false });
            }
        } else {
            console.debug('Invalid URL: ' + url);
        }
    };

    useEffect(() => {
        testESConnection(state.esURL);
    }, []);

    return (
        <AppContext.Provider
            value={{
                esStore,
                esIndex: state.esIndex,
                setSelectedIndex,
                selectedFiles: state.selectedFiles,
                toggleFile,
                esURL: state.esURL,
                testESConnection,
                esConnected: state.esConnected,
                themeMode: state.themeMode,
                toggleThemeMode,
                drawerOpen: state.drawerOpen,
                toggleDrawer,
            }}>
            <ThemeProvider theme={darkTheme}>
                <Router basename='/maverick'>
                    <Layout />
                </Router>
            </ThemeProvider>
        </AppContext.Provider>
    );
};

export default App;
