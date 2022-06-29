const INDEX_PREFIX = "mvk-";

const esStore = (esURL) => {
    const defaultHeaders = {
        'Content-Type': 'application/json'
    }

    // TODO: Yes, I know... Handle errors :/
    const prefixIndex = index => {
        if (!index.startsWith(INDEX_PREFIX)) {
            return INDEX_PREFIX + index;
        }

        return index;
    }

    const getIndices = async () => {
        const result = await fetch(`${esURL}/_cat/indices/${INDEX_PREFIX}*?s=index:asc&format=json`,
            {
                method: "GET",
                headers: defaultHeaders,
            });

        if (result.ok) {
            return result.json();
        }

        console.error(result);

        return [];
    }

    const search = async (index, payload) => {
        index = prefixIndex(index);

        const result = await fetch(`${esURL}/${index}/_search`,
            {
                method: "POST",
                headers: defaultHeaders,
                body: JSON.stringify(payload)
            });

        if (result.ok) {
            return result.json();
        }

        console.error(result);

        return {};
    }

    const createAndConfigureIndex = async index => {
        index = prefixIndex(index);

        const result = await fetch(`${esURL}/${index}`,
            {
                method: "PUT",
                headers: defaultHeaders,
                body: `
                {
                    "mappings": {
                      "properties": {
                        "type": { "type": "keyword" },
                        "parentguid": { "type": "keyword" },
                        "fileguid": { "type": "keyword" },
                        "filename": { 
                            "type": "text",
                            "fields": {
                                "keyword": { 
                                    "type": "keyword"
                                }
                            }
                        },
                        "linenumber": { "type": "long" },
                        "entryfirstline": { "type": "long" },
                        "entrymd5": { "type": "keyword" },
                        "timestamp": { "type": "date"},
                        "loglevel": { "type": "keyword"},
                        "content": { "type": "text" },
                        "rawline": { "type": "text" },
                        "flags": {"type": "keyword" }
                      }
                    }
                  }
                `
            });

            if (!result.ok) {
                console.error(result);
            }
    }

    const doesIndexExist = async index => {
        index = prefixIndex(index);

        let response = await fetch(`${esURL}/_cat/indices/${index}`,
            {
                method: "GET",
                headers: defaultHeaders,
            });

        return response.ok;
    }

    const postToIndex = async (index, doc) => {
        index = prefixIndex(index);

        if (!(await doesIndexExist(index))) {
            await createAndConfigureIndex(index);
        }

        let response;
        if (!Array.isArray(doc)) {
            response = await fetch(`${esURL}/${index}/_doc?refresh=wait_for`,
                {
                    method: "POST",
                    headers: defaultHeaders,
                    body: doc
                });
        } else { // Some manual bulk request
            const body = doc.join(`\n`) + '\n';
            response = await fetch(`${esURL}/${index}/_bulk?refresh=wait_for`,
                {
                    method: "POST",
                    headers: defaultHeaders,
                    body
                });
        }

        if (!response || !response.ok) {
            console.error(response);
        } else {
            const jsonResponse = await response.json();
            if (jsonResponse.errors) {
                console.error(jsonResponse);
            }
        }
    }

    const canConnect = async url => {
        try {
            let response = await fetch(`${url}/_cat/health`,
                {
                    method: "GET",
                    headers: defaultHeaders,
                });

            return response.ok;
        } catch {
            return false;
        }
    }

    const deleteIndices = async prefix => {
        prefix = prefixIndex(prefix);

        const result = await fetch(`${esURL}/_cat/indices/${prefix}*?s=index:asc&format=json`,
            {
                method: "GET",
                headers: defaultHeaders,
            });

        (await result.json()).forEach(e => {
            console.warn(`Deleting: ` + e.index)
            fetch(`${esURL}/${e.index}`,
            {
                method: "DELETE",
                headers: defaultHeaders,
            });
        })
    }

    const updateByQuery = async (index, payload) => {
        index = prefixIndex(index);

        const response = await fetch(`${esURL}/${index}/_update_by_query?refresh=true`,
        {
            method: "POST",
            headers: defaultHeaders,
            body: JSON.stringify(payload)
        });

        return response.ok
    }

    return {
        createAndConfigureIndex,
        doesIndexExist,
        postToIndex,
        search,
        getIndices,
        canConnect,
        deleteIndices,
        updateByQuery
    }
}

export { esStore as esStoreFactory };