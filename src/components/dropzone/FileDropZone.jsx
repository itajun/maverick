import { Paper } from "@mui/material";
import React, { useState } from "react";
import FileProcessorProgressTracker from "./FileProcessorProgressTracker";
import FileProgress from "./FileProgress";

const FileDropZoneRenderer = ({ dropHandler, processors }) =>
  <>
    <Paper id="drop_zone" onDrop={dropHandler} onDragOver={ev => ev.preventDefault()} sx={{ padding: 2, margin: 1 }}>
      <p>Drag some files to this Drop Zone ...</p>
    </Paper>
    {
      processors.map((processor, idx) =>
        <FileProcessorProgressTracker key={`tracker${idx}`} processor={processor}>
          {(fileName, progress) => <FileProgress fileName={fileName} progress={progress} />}
        </FileProcessorProgressTracker>
      )
    }
  </>
export default ({ processorFactory }) => {
  const [processors, setProcessors] = useState([]);

  const dropHandler = async ev => {
    ev.preventDefault();

    let newProcessors = [...processors];
    if (ev.dataTransfer.items) {
      for (let i = 0; i < ev.dataTransfer.items.length; i++) {
        if (ev.dataTransfer.items[i].kind === 'file') {
          const processor = processorFactory(ev.dataTransfer.items[i].getAsFile());
          newProcessors.push(processor);
        }
      }
    } else {
      for (let i = 0; i < ev.dataTransfer.files.length; i++) {
        const processor = processorFactory(ev.dataTransfer.files[i]);
        newProcessors.push(processor);
      }
    }

    setProcessors(newProcessors);
  }

  return (<FileDropZoneRenderer processors={processors} dropHandler={dropHandler} />);
}
