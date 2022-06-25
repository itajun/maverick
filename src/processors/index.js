export class LoadFileToESProcessor {
    constructor(esStore, indexName, file, progressCallback, esBatchSize = 1000) {
        this.indexName = indexName;
        this.file = file;
        this.progressCallback = progressCallback;
        this.progress = 0;
        this.cancelled = false;
        this.esStore = esStore;
        this.esBatchSize = esBatchSize;
    }

    process() {
        if (this.processCalled) {
            return;
        }
        this.processCalled = true;

        console.debug(`Processing ${this.file.name} with size ${this.file.size}`);

        const outter = this;
        let reader = new FileReader();
        reader.onload = async function () {
            try {
                let lines = this.result.split('\n');
                let batch = [];

                for (var line = 0; line < lines.length; line++) {
                    if (outter.cancelled) {
                        console.warn("Process cancelled");
                        break;
                    }

                    batch.push(lines[line]);
                    if (batch.length === outter.esBatchSize) {
                        await outter.esStore.postToIndex(outter.indexName, batch);
                        batch = [];
                    }
                    outter.progress = (line * 100) / lines.length;
                    outter.progressCallback && outter.progressCallback(outter.progress);
                }
                if (batch.length > 0) {
                    await outter.esStore.postToIndex(outter.indexName, batch);
                    batch = [];
                }
            } finally {
                outter.progress = 100;
                outter.progressCallback && outter.progressCallback(outter.progress);
            }
        };

        reader.readAsText(this.file);
    }


    cancel() {
        this.cancelled = true;
    }
}
