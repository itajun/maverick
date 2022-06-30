import { useTheme } from '@mui/material/styles';
import React, { useContext, useState, useEffect } from 'react';
import {
    AdminPanelSettings,
    AdminPanelSettingsOutlined,
    ContentCopy,
    ContentCopyOutlined,
    TableRows,
    TableRowsOutlined,
} from '../../../node_modules/@mui/icons-material/index';
import {
    Box,
    Checkbox,
    CircularProgress,
    Divider,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '../../../node_modules/@mui/material/index';
import { AppContext } from '../../App';
import LineList from './LineList';

// TODO: Break this massive component down
const EntryFinder = () => {
    const { esStore, esIndex, selectedFiles } = useContext(AppContext);

    const [loading, setLoading] = useState(true); // If data is loading
    const [searchText, setSearchText] = useState(); // Text typed by the user
    const [advanced, setAdvanced] = useState(false); // Advanced mode
    const [deduplicate, setDeduplicate] = useState(false); // If we should deduplicate entries
    const [stackTrace, setStackTrace] = useState(false); // Filter only for stack traces
    const [searchTimeout, setSearchTimeout] = useState(); // Used to delay the search as the user types
    const [data, setData] = useState([]); // The rows TODO: Rename
    const [selectedRow, setSelectedRow] = useState(); // The selected row

    const theme = useTheme();

    useEffect(() => {
        loadData();
    }, [deduplicate, stackTrace, searchText, selectedFiles, esIndex]);

    // ********** Queries

    // Query built using the selected options and typed search, with an optional aggregation
    const query = (aggs) => {
        const filter = [];
        const must = [];

        if (stackTrace) {
            filter.push({
                term: {
                    flags: 'stacktrace',
                },
            });
        }

        if (selectedFiles && selectedFiles.length > 0) {
            const terms = selectedFiles.map((e) => ({
                term: { fileguid: { value: e } },
            }));

            filter.push({
                bool: {
                    should: terms,
                },
            });
        }

        if (searchText && searchText.length > 0) {
            if (advanced) {
                must.push({
                    query_string: {
                        query: searchText,
                        default_field: 'content',
                    },
                });
            } else {
                must.push({
                    simple_query_string: {
                        query: searchText,
                        fields: ['content'],
                    },
                });
            }
        }

        return {
            query: {
                bool: {
                    filter,
                    must,
                },
            },
            _source: [
                'fileguid',
                'filename',
                'entryfirstline',
                'linenumber',
                'timestamp',
                'loglevel',
                'content',
                'flags',
            ],
            sort: [
                {
                    fileguid: {
                        order: 'asc',
                    },
                },
                {
                    linenumber: {
                        order: 'asc',
                    },
                },
            ],
            aggs: aggs ? aggs : {},
            size: 1000,
        };
    };

    // Just the aggregation that can be combined with query(^) above
    const dedupEntriesAgg = () => {
        return {
            md5: {
                terms: {
                    field: 'entrymd5',
                    size: 1000,
                },
                aggs: {
                    first_doc: {
                        top_hits: {
                            _source: {
                                includes: [
                                    'fileguid',
                                    'filename',
                                    'entryfirstline',
                                    'linenumber',
                                    'timestamp',
                                    'loglevel',
                                    'content',
                                    'flags',
                                ],
                            },
                            size: 1,
                        },
                    },
                },
            },
        };
    };

    // ********* Methods

    // Performs the actual search
    const doSearch = async () => {
        let result;
        if (deduplicate) {
            result = await esStore.search(esIndex, query(dedupEntriesAgg()));
        } else {
            result = await esStore.search(esIndex, query());
        }

        if (result.aggregations) {
            const mergeProperties = (bucket) => {
                const result = bucket.first_doc.hits.hits[0]._source;
                return { ...result, doc_count: bucket.doc_count };
            };
            setData(
                result.aggregations.md5.buckets.map((e) => mergeProperties(e))
            );
        } else if (result.hits && result.hits) {
            setData(result.hits.hits.map((e) => e._source));
        } else {
            setData([]);
        }
        setLoading(false);
        setSelectedRow(null);
    };

    // Marks the data as being loaded and calls the async search
    const loadData = async () => {
        setLoading(true);
        doSearch();
    };

    // Marks the row as selected and makes sure the row is visible
    const handleSelectRow = (row, idx) => () => {
        setSelectedRow(row);
    };

    // Helpers to check if the row/entry is selected based on the row
    const isSelRow = (row) =>
        selectedRow &&
        row.fileguid === selectedRow.fileguid &&
        row.linenumber === selectedRow.linenumber;
    const isSelEntry = (row) =>
        selectedRow &&
        row.fileguid === selectedRow.fileguid &&
        row.entryfirstline === selectedRow.entryfirstline;

    // Triggers the search after 500ms
    const delayedSearch = (text) => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        setSearchTimeout(setTimeout(() => setSearchText(text), 500));
        setLoading(true);
    };

    return (
        <Box
            id='entry-finder-root'
            sx={{
                display: 'flex',
                flexDirection: 'column',
                width: 0,
                flex: 1,
                p: '10px',
            }}>
            {loading && (
                <Box
                    sx={{
                        zIndex: 2000,
                        position: 'absolute',
                        right: '50%',
                        top: '20px',
                        width: '25px',
                        height: '25px',
                    }}>
                    <CircularProgress sx={{ color: 'white' }} size='1rem' />
                </Box>
            )}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                <TextField
                    label='Search...'
                    type='search'
                    sx={{ flex: 1, p: '0 5px 0' }}
                    onChange={(e) => delayedSearch(e.target.value)}
                    autoComplete='off'
                />
                <Tooltip title='Advanced'>
                    <Checkbox
                        icon={<AdminPanelSettingsOutlined />}
                        checkedIcon={<AdminPanelSettings />}
                        checked={advanced}
                        onChange={(e) => setAdvanced(e.target.checked)}
                        sx={{ height: 'fit-content' }}
                    />
                </Tooltip>
                <Tooltip title='Deduplicate'>
                    <Checkbox
                        icon={<ContentCopyOutlined />}
                        checkedIcon={<ContentCopy />}
                        checked={deduplicate}
                        onChange={(e) => setDeduplicate(e.target.checked)}
                        sx={{ height: 'fit-content' }}
                    />
                </Tooltip>
                <Tooltip title='Stacktrace only'>
                    <Checkbox
                        icon={<TableRowsOutlined />}
                        checkedIcon={<TableRows />}
                        checked={stackTrace}
                        onChange={(e) => setStackTrace(e.target.checked)}
                        sx={{ height: 'fit-content' }}
                    />
                </Tooltip>
            </Box>
            <Paper
                id='root-table'
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    p: '5px',
                    m: '10px 0',
                    height: '400px',
                    flex: 1,
                }}>
                {!loading && data.length === 0 && (
                    <Typography>Nothing to see here...</Typography>
                )}
                {data.length > 0 && (
                    <TableContainer
                        id='root-table-container'
                        component={Paper}
                        sx={{ maxHeight: selectedRow ? '30%' : null }}>
                        <Table size='small'>
                            <TableHead>
                                <TableRow>
                                    <TableCell style={{ border: 0 }}>
                                        <Typography>
                                            {data.length >= 1000
                                                ? '1000+'
                                                : data.length}{' '}
                                            results
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody
                                sx={{
                                    '& td': { padding: '2px' },
                                    '& pre': {
                                        padding: 0,
                                        margin: 0,
                                        fontSize: '0.75em',
                                    },
                                }}>
                                {data.map((row, idx) => (
                                    <TableRow
                                        key={`${row.fileguid}-${row.linenumber}`}
                                        sx={{
                                            '& td, & th': {
                                                backgroundColor: isSelRow(row)
                                                    ? theme.palette.grey['500']
                                                    : isSelEntry(row)
                                                    ? theme.palette.grey['400']
                                                    : null,
                                            },
                                        }}
                                        onClick={handleSelectRow(row, idx)}>
                                        <TableCell>
                                            <pre>{row.timestamp}</pre>
                                        </TableCell>
                                        <TableCell>
                                            <pre>{row.loglevel}</pre>
                                        </TableCell>
                                        <TableCell sx={{ width: '100%' }}>
                                            <pre>{row.content}</pre>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                <Divider sx={{ m: '5px 0' }} />
                {selectedRow && (
                    <Box
                        sx={{
                            flex: 1,
                            width: '100%',
                            overflow: 'scroll',
                            p: '5px',
                            lineHeight: 1,
                        }}>
                        <LineList
                            searchText={searchText}
                            fileGuid={selectedRow.fileguid}
                            lineNumber={selectedRow.linenumber}
                        />
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default EntryFinder;
