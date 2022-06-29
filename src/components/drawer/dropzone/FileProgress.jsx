import { LinearProgress, Paper, Typography } from '@mui/material';
import React from 'react';

const FileProgress = ({ fileName, progress }) =>
    <Paper sx={{ padding: 1, margin: 1 }}>
        <Typography fontSize={12} overflow="hidden" textOverflow="ellipsis">{fileName}</Typography>
        <LinearProgress variant="determinate" value={progress} />
    </Paper>;

export default FileProgress;