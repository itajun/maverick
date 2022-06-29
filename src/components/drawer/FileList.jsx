import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../App";
import { Checkbox, List, ListItem, Typography } from "../../../node_modules/@mui/material/index";

const FileList = ({ files, selectedFiles, toggleFile }) =>
  <List>
    {files && files.map(([ filename, fileguid]) => (
      <ListItem key={fileguid} sx={{ p: 0 }}>
        <Checkbox
          checked={selectedFiles.length > 0 && selectedFiles.includes(fileguid)}
          onChange={() => toggleFile(fileguid)}
          size="small" />
        <Typography>{filename}</Typography>
      </ListItem>
    ))}
  </List>

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
              ]
            }
          }
        },
        "size": 0
      }
    );

    setFiles(result ? result.aggregations.files.buckets.map(e => e.key) : [])
  }

  useEffect(() => { loadFiles() }, [selectedFiles, esIndex]);

  return <FileList files={files} selectedFiles={selectedFiles} toggleFile={toggleFile} />
}