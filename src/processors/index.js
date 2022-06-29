import { v4 as uuidv4 } from 'uuid';
import { MD5 } from 'crypto-js';

// TODO These should be configurable and reside outside of this file
const LOG_ENTRY_REGEX = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3} .\d{4}) \[.*?] \d*? ([A-Z]+?) (.*? - )(.*)/
const STACK_TRACE_REGEX = /^\s*?at \w+\.?\$?.+:\d+\).*/

export class LoadFileToESProcessor {
    constructor(esStore, indexName, file, progressCallback, completionCallback, esBatchSize = 10000) {
        this.indexName = indexName;
        this.file = file;
        this.progressCallback = progressCallback; // Called for each line read
        this.completionCallback = completionCallback; // Called when progress = 100
        this.progress = 0;
        this.cancelled = false; // If it was cancelled by the user
        this.esStore = esStore;
        this.esBatchSize = esBatchSize; // Max size of the currentBatch before it is flushed

        this.currentBatch = []; // Batch of documents to be indexed/updated before it is flushed
        this.fileGuid = uuidv4(); // Unique GUID assigned to the file
        this.fileName = file.name;

        this.entryGuid = null; // The GUID of the line that is the first of a multi-line entry
        this.entryDocIds = []; // GUIDs of the lines that are part of the same entry

        // While we add line by line, there is information line the flags and MD5 that we can only calculate per entry. These are kere
        // and updated via updateCurrentEntryAndStartNew()
        this.entryContent = []; // Content of the entry while we read it from multiple lines (so we can get the MD5)
        this.entryFlags = []; // Flags to be added to the entry

        this.logEntriesAdded = 0;
    }

    process() {
        if (this.processCalled) {
            return;
        }
        this.processCalled = true; // Don't process 2X

        console.debug(`Processing ${this.file.name} with size ${this.file.size}`);

        let reader = new FileReader();
        reader.onload = this.handleOnLoad(reader);
        reader.readAsText(this.file);
    }

    handleOnLoad = reader => async () => {
        try {
            const fileGuid = this.fileGuid;
            const fileName = this.fileName;

            let lines = reader.result.split('\n');

            let timestamp, logLevel // We replicate the timestamp and logLevel for multi-line entries
            for (var lineNumber = 0; lineNumber < lines.length; lineNumber++) {
                if (this.cancelled) {
                    console.warn("Process cancelled");
                    break;
                }

                const line = lines[lineNumber];
                const docId = `${fileGuid}-${lineNumber}`;

                let newLineDoc = {
                    'fileguid': fileGuid,
                    'filename': fileName,
                    'type': 'line',
                    'linenumber': lineNumber + 1
                };

                const match = line.match(LOG_ENTRY_REGEX);
                const newEntry = match && match.length > 0;
                let content = null;
                if (newEntry) {
                    timestamp = match[1];
                    logLevel = match[2];
                    // 3 - Thread name
                    content = match[4];

                    this.updateCurrentEntryAndStartNew();
                } else if (!timestamp) { // We haven't read any successful entry yet
                    console.warn("Skipping leading invalid log entry: " + lineNumber + " - " + line);
                    continue;
                }

                newLineDoc['timestamp'] = new Date(timestamp).toISOString();
                newLineDoc['loglevel'] = logLevel;
                newLineDoc['content'] = content || line;
                newLineDoc['rawline'] = line;

                // Keep track so we can get the MD5
                this.entryContent.push(content || line);
                this.entryDocIds.push(docId);

                // Mark the entire entry as a stack trace if it matches the regex
                if (!!line.match(STACK_TRACE_REGEX) && !this.entryFlags.includes("stacktrace")) {
                    this.entryFlags.push("stacktrace");
                }

                this.addIndexOperation(docId, newLineDoc);

                if (this.currentBatch.length === this.esBatchSize) {
                    await this.flush();
                }

                this.reportProgress((lineNumber * 100) / lines.length);
            }

            this.updateCurrentEntryAndStartNew();
        } finally {
            await this.flush();
            this.reportProgress(100);
        }
    };

    async flush() {
        if (this.currentBatch.length === 0) {
            return;
        }
        await this.esStore.postToIndex(this.indexName, this.currentBatch);
        this.currentBatch = [];
    }

    // Called when we have a new entry or finished the file, so we know the stack is complete
    // if we were in the process of capturing one.
    updateCurrentEntryAndStartNew() {
        if (this.entryDocIds.length === 0) // First entry?
        {
            return;
        }

        const entryMD5 = MD5(this.entryContent.join('\n')).toString();

        this.logEntriesAdded++;

        // Add updates to all docs to add the relevant fields
        this.entryDocIds.forEach(e => {
            this.addUpdateOperation(e, {
                'doc': {
                    'entryfirstline': this.logEntriesAdded,
                    'entrymd5': entryMD5,
                    'flags': this.entryFlags
                }
            })
        });

        this.entryDocIds = [];
        this.entryContent = [];
        this.entryFlags = [];
    }

    addIndexOperation(id, o) {
        this.currentBatch.push(
            JSON.stringify({
                'index': {
                    '_index': this.indexName,
                    '_id': id
                }
            }),
            JSON.stringify(o)
        )
    }

    addUpdateOperation(id, o) {
        this.currentBatch.push(
            JSON.stringify({
                'update': {
                    '_index': this.indexName,
                    '_id': id
                }
            }),
            JSON.stringify(o)
        )
    }

    reportProgress(progress) {
        this.progress = progress;
        this.progressCallback && this.progressCallback(progress);

        if (progress === 100) {
            this.completionCallback && this.completionCallback(this);
        }
    }

    cancel() {
        this.cancelled = true;
    }
}
