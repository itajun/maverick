import React from "react";
import { PieChartTwoTone } from "@mui/icons-material";
import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import UploadButton from "./bound/UploadButton";
import WorkerList from "./bound/WorkerList";

export default () =>
    <Box>
        <AppBar position="static">
            <Toolbar>
                <PieChartTwoTone />
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
                    MAVERICK
                </Typography>
                <UploadButton />
            </Toolbar>
        </AppBar>
        <Box sx={{ m: [ 2, 1 ] }}>
            <WorkerList />
        </Box>
    </Box>