import { Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../App";

const getWorkers = async (esStore, esIndex) => {
    const result = await esStore.search(esIndex,
        {
            "query": {
                "bool": {
                    "filter": [
                        {
                            "term": {
                                "messageClass.keyword": {
                                    "value": "DiskSpaceMessage"
                                }
                            }
                        },
                        {
                            "exists": {
                                "field": "message.machineName"
                            }
                        },
                        {
                            "exists": {
                                "field": "message.workerGuid"
                            }
                        }
                    ]
                }
            },
            "aggs": {
                "machines": {
                    "multi_terms": {
                        "terms": [
                            {
                                "field": "message.machineName.keyword"
                            },
                            {
                                "field": "message.workerGuid.keyword"
                            }
                        ]
                    }
                }
            },
            "size": 0
        }
    );

    return result.aggregations.machines.buckets.map(e => e.key)
}

export default () => {
    const { esStore, esIndex } = useContext(AppContext);
    const [workerList, setWorkerList] = useState([]);

    const loadWorkers = async () => {
        const result = await getWorkers(esStore, esIndex);
        setWorkerList(result);
    }

    useEffect(() => {
        loadWorkers()
    }, []);

    return (
        <>
            {
                workerList.length == 0 && "No workers found"
            }
            {
                workerList.length > 0 &&
                workerList.map(worker =>
                    <Typography>{worker[0]} - {worker[1]}</Typography>
                )
            }
        </>
    )
}