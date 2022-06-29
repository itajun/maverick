import React, { Fragment, useContext, useEffect, useState } from 'react';
import { Box } from '../../../node_modules/@mui/material/index';
import { AppContext } from '../../App';

const LineList = ({ searchText = '', fileGuid, lineNumber = 0 }) => {
    const { esStore, esIndex } = useContext(AppContext);

    const [lines, setLines] = useState([]);

    const loadLines = async () => {
        const result = await esStore.search(esIndex, {
            'query': {
                'query_string': {
                    'query': `fileguid: ${fileGuid} && linenumber:[${lineNumber - 5} TO ${lineNumber + 245}]`
                }
            },
            '_source': [
                'linenumber',
                'rawline'
            ],
            'sort': [
                {
                    'fileguid': {
                        'order': 'asc'
                    }
                },
                {
                    'linenumber': {
                        'order': 'asc'
                    }
                }
            ],
            'highlight': {
                'highlight_query': {
                    'simple_query_string': {
                        'query': searchText,
                        'fields': ['rawline']
                    }
                },
                'fields':
                {
                    'rawline': {
                        'fragment_size': 4096
                    }
                }
            },
            'size': 250
        });

        setLines(result.hits.hits.map(e => e.highlight ? { ...e._source, rawline: e.highlight.rawline[0] } : e._source));
    };

    const toFormattedLine = line => {
        const parts = line.rawline.split(/<.?em>/);
        const startsWith = line.rawline.startsWith('<em>');
        const partsComps = [];

        parts.forEach((part, idx) => {
            if (startsWith && (idx % 2 === 0)) {
                partsComps.push((<em key={`${line.linenumber}-${idx}`}>{part}</em>));
            } else if (idx % 2 === 1) {
                partsComps.push((<em key={`${line.linenumber}-${idx}`}>{part}</em>));
            } else {
                partsComps.push((<pre key={`${line.linenumber}-${idx}`}>{part}</pre>));
            }
        });

        if (line.linenumber === lineNumber) {
            return (<span style={{ background: 'lightslategray' }} key={`${fileGuid}-${line.linenumber}`}>{partsComps}<br /></span>);
        }

        return (<Fragment key={`${fileGuid}-${line.linenumber}`}>{partsComps}<br /></Fragment>);
    };

    useEffect(() => { loadLines(); }, [fileGuid, lineNumber, searchText]);

    return (
        <Box sx={{ '& em': { background: 'darkcyan' }, '& pre': { display: 'inline' } }} >
            <pre style={{ fontSize: '0.75em' }}>
                {
                    lines.map(line => toFormattedLine(line))
                }
            </pre>
        </Box>
    );
};

export default LineList;