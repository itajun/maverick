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
        <Box>
            <IndexSelector />

            <FileDropZone processorFactory={file => new LoadFileToESProcessor(esStore, esIndex, file)} processorCompleted={processor => toggleFile(processor.fileGuid)} />

            <FileList />
        </Box>
    )
}