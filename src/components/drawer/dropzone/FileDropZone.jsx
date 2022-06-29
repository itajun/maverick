import { Paper } from "@mui/material";
import React, { useState } from "react";
import FileProcessorProgressTracker from "./FileProcessorProgressTracker";
import FileProgress from "./FileProgress";

const FileDropZoneRenderer = ({ dropHandler, processors }) =>
  <>
    <Paper id="drop_zone" onDrop={dropHandler} onDragOver={ev => ev.preventDefault()} sx={{ padding: 2, margin: 1 }}>
      <p>Drop Zone</p>
    </Paper>
    {
      processors.map((processor, idx) =>
        <FileProcessorProgressTracker key={`tracker${idx}`} processor={processor}>
          {(fileName, progress) => <FileProgress fileName={fileName} progress={progress} />}
        </FileProcessorProgressTracker>
      )
    }
  </>

export default ({ processorFactory, processorCompleted }) => {
  const [processors, setProcessors] = useState([]);

  const completionCallback = processor => {
    setProcessors(p => p.filter(e => e !== processor))  
    processorCompleted && processorCompleted(processor);
  }

  const handleLogFile = async file => {
    let newProcessors = [];
    const processor = processorFactory(file);
    processor.completionCallback = completionCallback;
    newProcessors.push(processor);
    setProcessors(p => [...p, ...newProcessors]);
  }

  const handleFile = async file => {
    const fileName = file.name;

    if (fileName.endsWith('log')) {
      handleLogFile(file);
      return;
    }

    // Extract from zip
    console.log(fileName);


  }

  const dropHandler = async ev => {
    ev.preventDefault();

    if (ev.dataTransfer.items) {
      for (let i = 0; i < ev.dataTransfer.items.length; i++) {
        if (ev.dataTransfer.items[i].kind === 'file') {
          handleFile(ev.dataTransfer.items[i].getAsFile());
        }
      }
    } else {
      for (let i = 0; i < ev.dataTransfer.files.length; i++) {
        handleFile(ev.dataTransfer.files[i])
      }
    }

  }

  return (<FileDropZoneRenderer processors={processors} dropHandler={dropHandler} />);
}
