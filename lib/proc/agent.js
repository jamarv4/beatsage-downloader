const path = require('path');
const { fork } = require('child_process');


let tickInterval = null;
let options = null;
let maxRunningProcesses = 2; // Absolutely NOT recommended to increase. Be nimble, and respect their servers by not spamming.
let currentRunningProcesses = 0;
let queue = []; // URL queue

function updateQueue(opts) {
    queue.push(opts.urlInput);
}
function getUrlFromQueue() {
    return queue.length ? queue.shift() : null;
}
function stopTick() {
    return tickInterval 
            ? clearInterval(tickInterval)
            : false;
}
function init(opts) {
    new Promise(() => {
        options = opts;
        tickInterval = setInterval(tick, 1000);
    });
}

function spawnDownloaderProcess(url, options) {
    currentRunningProcesses++

    const proc = fork(
                        path.join(__dirname, './downloader'),
                        [
                            url,
                            JSON.stringify({
                                folder: options.folder,
                                modifiers: options.modifiers,
                                mapFormat: options.mapFormat,
                            })
                        ]
                    );

    proc.on('close', () => (currentRunningProcesses--));
}
function tick () {
    if  (!queue.length || currentRunningProcesses >= maxRunningProcesses) return;

    return spawnDownloaderProcess(getUrlFromQueue(), options);
}

process.on('beforeExit', stopTick);

module.exports = { init, updateQueue };
