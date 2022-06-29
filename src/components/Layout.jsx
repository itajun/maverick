import SettingsIcon from '@mui/icons-material/Settings';
import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import { AppContext } from '../App';
import React, { useContext, useEffect, useState } from "react";
import {
    Route, Routes
} from "react-router-dom";
import { AutoDelete, Psychology } from "../../node_modules/@mui/icons-material/index";
import { CssBaseline, FormControl, FormGroup, FormLabel, IconButton, TextField } from "../../node_modules/@mui/material/index";
import { useNavigate } from "../../node_modules/react-router-dom/index";
import Drawer from "./drawer/Drawer";
import EntryFinder from "./logviewer/EntryFinder";

const Main = () => {
    return (<Box id='main-root' component="div" sx={{ display: 'flex', flex: 1, pt: '65px' }}>
        <Box sx={{ minWidth: 300, flex: 2, display: 'flex' }}>
            <Drawer />
        </Box>
        <Box sx={{ display: 'flex', flex: 8 }}>
            <EntryFinder />
        </Box>
    </Box>
    )
}

const Preferences = () => {
    const { esStore, esURL, testESConnection, esConnected } = useContext(AppContext);
    const [tempURL, setTempURL] = useState(esURL ? esURL : '');
    const [esIndices, setESIndices] = useState('mvk-*');


    const handleOnChangeESURL = ev => {
        const url = ev.target.value;
        testESConnection(url);
        setTempURL(url);
    }

    const handleDeleteIndices = async => {
        esStore.deleteIndices(esIndices);
    }

    return (
        <Box id='preferences-root' component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pt: '65px', flex: 1 }}>
            <FormControl sx={{ m: 3 }} component="fieldset" variant="standard" style={{ padding: '25px 0', width: 450 }}>
                <FormLabel component="legend">Elasticsearch settings</FormLabel>
                <FormGroup>
                    <TextField
                        label="URL"
                        error={!esConnected}
                        helperText={`Enter a valid ES URL (last valid: ${esURL ? esURL : '-'})`}
                        value={tempURL}
                        onChange={handleOnChangeESURL}
                    />
                    <Box sx={{ display: 'flex', mt: '15px' }}>
                        <TextField
                            label="Remove these indices"
                            helperText="No confirmation. We're adults."
                            value={esIndices}
                            onChange={e => setESIndices(e.target.value)}
                            sx={{ flex: 1 }}
                        />
                        <IconButton onClick={handleDeleteIndices} sx={{ height: 'fit-content', mt: '10px' }} disabled={!esConnected}>
                            <AutoDelete />
                        </IconButton>
                    </Box>
                </FormGroup>
            </FormControl>
        </Box>
    )
}

const SettingsButton = () => {
    const navigate = useNavigate();

    return (
        <IconButton onClick={() => navigate('/preferences')}><SettingsIcon /></IconButton>
    )
}

const HomeButton = () => {
    const navigate = useNavigate();

    return (
        <IconButton onClick={() => navigate('/')}><Psychology /></IconButton>
    )
}

export default () => {
    const navigate = useNavigate();
    const { esConnected, esURL } = useContext(AppContext);

    useEffect(() => {
        if (!esURL) {
            navigate('/preferences')
        }
    }, [esURL])

    return (
        <Box id='layout-root' sx={{ display: 'flex', height: 'inherit', width: 'inherit' }}>
            <CssBaseline />
            <AppBar>
                <Toolbar>
                    <HomeButton />
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        href="/"
                        sx={{
                            mr: 2,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                            ml: 2,
                            width: '100%'
                        }}
                    >
                        LOGUEI
                    </Typography>
                    <SettingsButton />
                </Toolbar>
            </AppBar >
            <Routes>
                <Route path="/preferences" element={<Preferences />} />
                <Route path="/" element={esConnected ? <Main /> : <Typography sx={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>ES not connected</Typography>} />
            </Routes>
        </Box >
    )
}