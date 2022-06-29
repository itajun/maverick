import { useEffect, useState } from 'react';

const FileProcessorProgressTracker = ({ processor, children }) => {
    const [progress, setProgress] = useState(0);
  
    useEffect(() => {
        processor.progressCallback = setProgress;
        processor.process();
        return () => {
            processor.cancel();
        };
    }, []);
  
    return children(processor.file.name, progress);
};

export default FileProcessorProgressTracker;