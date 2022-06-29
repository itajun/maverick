import React, { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../App";
import { Box, Checkbox, List, ListItem, TextField, Typography } from "../../../node_modules/@mui/material/index";

const FileList = ({ files, selectedFiles, toggleFile, renameFile }) => {
  const [editing, setEditing] = useState();
  const textBoxRef = useRef();

  const handleEdit = guid => () => {
    setEditing(guid);
  }

  const handleSave = guid => evt => {
    renameFile(guid, evt.target.value);
    setEditing(null)
  }

  useEffect(() => {
    if (textBoxRef.current) {
      textBoxRef.current.focus()
      textBoxRef.current.select()
    }
  })

  return (<Box id='root-file-list' sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'scroll' }}>
    <List>
      {files && files.map(([filename, fileguid]) => (
        <ListItem key={fileguid} sx={{ p: 0 }}>
          <Checkbox
            checked={selectedFiles.length > 0 && selectedFiles.includes(fileguid)}
            onChange={() => toggleFile(fileguid)}
            size="small" />
          {editing === fileguid && (
            <TextField defaultValue={filename} onBlur={handleSave(fileguid)} inputRef={textBoxRef} />
          )}
          {editing !== fileguid && (
            <Typography sx={{ cursor: 'pointer' }} onClick={handleEdit(fileguid)}>{filename}</Typography>
          )}
        </ListItem>
      ))}
    </List>
  </Box>)
}

export default () => {
  const { esStore, esIndex, selectedFiles, toggleFile } = useContext(AppContext);

  const [files, setFiles] = useState([]);

  const loadFiles = async () => {
    let result = await esStore.doesIndexExist(esIndex) && await esStore.search(esIndex,
      {
        "query": {
          "match_all": {}
        },
        "aggs": {
          "files": {
            "multi_terms": {
              "terms": [
                {
                  "field": "filename.keyword"
                },
                {
                  "field": "fileguid"
                }
              ],
              size: 100
            }
          }
        },
        "size": 0
      }
    );

    setFiles(result ? result.aggregations.files.buckets.map(e => e.key) : [])
  }

  const renameFile = async (guid, newName) => {
    if (!guid || !newName || newName.length === 0) {
      console.warn(`Will not rename because either guid or name are empty`)
      return;
    }

    const updateOperation =
    {
      'script': {
        'source': `ctx._source.filename = '${newName}'`,
        'lang': 'painless'
      },
      'query': {
        'term': {
          'fileguid': guid
        }
      }
    }

    await esStore.updateByQuery(esIndex, updateOperation)
    loadFiles();
  }

  useEffect(() => { loadFiles() }, [selectedFiles, esIndex]);

  return <FileList files={files} selectedFiles={selectedFiles} toggleFile={toggleFile} renameFile={renameFile} />
}