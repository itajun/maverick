import { AddCircle } from "@mui/icons-material";
import { Dialog, DialogTitle, IconButton } from "@mui/material";
import { AppContext } from "../../App";
import FileDropZone from "../dropzone/FileDropZone";
import { LoadFileToESProcessor } from "../../processors";
import React, { useContext, useState } from "react";

export default () => {
    const [isOpen, setOpen] = useState(false);
    const { esStore, esIndex } = useContext(AppContext)

    return (
        <>
            <IconButton style={{ color: 'white' }} disabled={isOpen} onClick={() => setOpen(true)}>
                <AddCircle />
            </IconButton>
            {isOpen &&
                <Dialog onClose={() => setOpen(false)} open>
                    <DialogTitle>Upload Data</DialogTitle>
                    <FileDropZone processorFactory={file => new LoadFileToESProcessor(esStore, esIndex, file)} />
                </Dialog>
            }
        </>
    )
}