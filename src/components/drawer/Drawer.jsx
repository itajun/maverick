import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import React, { useContext } from 'react';
import { Box, IconButton } from '../../../node_modules/@mui/material/index';
import { AppContext } from '../../App';
import { LoadFileToESProcessor } from '../../processors/index';
import FileList from '../drawer/FileList';
import FileDropZone from './dropzone/FileDropZone';
import IndexSelector from './IndexSelector';

const Drawer = () => {
    const { esStore, esIndex, toggleFile, drawerOpen, toggleDrawer } =
        useContext(AppContext);

    return (
        <Box
            id='root-drawer'
            sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minWidth: drawerOpen ? '280px' : 0,
            }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    m: '5px',
                }}>
                <IconButton onClick={toggleDrawer}>
                    {drawerOpen ? <ChevronLeft /> : <ChevronRight />}
                </IconButton>
            </Box>
            {drawerOpen && (
                <>
                    <IndexSelector />

                    <FileDropZone
                        processorFactory={(file) =>
                            new LoadFileToESProcessor(esStore, esIndex, file)
                        }
                        processorCompleted={(processor) =>
                            toggleFile(processor.fileGuid)
                        }
                    />

                    <FileList />
                </>
            )}
        </Box>
    );
};

export default Drawer;
