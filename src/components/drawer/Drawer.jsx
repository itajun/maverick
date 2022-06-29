import React, { useContext } from "react";
import { Box } from "../../../node_modules/@mui/material/index";
import { AppContext } from "../../App";
import { LoadFileToESProcessor } from "../../processors/index";
import FileList from "../drawer/FileList";
import FileDropZone from "./dropzone/FileDropZone";
import IndexSelector from './IndexSelector';

export default () => {
    const { esStore, esIndex, toggleFile } = useContext(AppContext)

    return (
        <Box id='root-drawer' sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <IndexSelector />

            <FileDropZone processorFactory={file => new LoadFileToESProcessor(esStore, esIndex, file)} processorCompleted={processor => toggleFile(processor.fileGuid)} />

            <FileList />
        </Box>
    )
}