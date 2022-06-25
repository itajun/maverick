
const esStore = (esURL) => {
    const defaultHeaders = {
        'Content-Type': 'application/json'
    }

    // TODO: Yes, I know... Handle errors :/

    const search = async (index, payload) => {
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
        await fetch(`${esURL}/${index}`,
            {
                method: "PUT",
                headers: defaultHeaders,
                body: `
          {
            "mappings": {
              "properties": {
                "timestamp": { "type": "long" },
                "messageClass": { "type": "keyword" },
                "handlerClass": { "type": "keyword" },
                "method": { "type": "keyword" },
                "handledIn": { "type": "long" },
                "threadName": { "type": "text" },
              }
            }
          }
        `
            });
    }

    const doesIndexExist = async index => {
        let response = await fetch(`${esURL}/_cat/indices/${index}`,
            {
                method: "GET"
            });

        return response.ok;
    }

    const postToIndex = async (index, doc) => {
        if (!(await doesIndexExist(index))) {
            await createAndConfigureIndex(index);
        }
        
        let response;
        if (!Array.isArray(doc)) {
            response = await fetch(`${esURL}/${index}/_doc`,
                {
                    method: "POST",
                    headers: defaultHeaders,
                    body: doc
                });
        } else {
            let body = `{"index": { "_index": "${index}" }}\n`;
            body += doc.join(`\n${body}`) + '\n'; // Add index for each line :/
            response = await fetch(`${esURL}/${index}/_bulk`,
                {
                    method: "POST",
                    headers: defaultHeaders,
                    body
                });
        }

        if (!response || !response.ok) {
            console.error(response);
        }
    }

    return {
        createAndConfigureIndex,
        doesIndexExist,
        postToIndex,
        search
    }
}

export { esStore as esStoreFactory };