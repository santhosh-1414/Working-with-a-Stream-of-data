const express = require('express');
const formidable = require('formidable');
const fs = require('fs/promises');

const app = express();
const PORT = 3000;

const Timer = require('./Timer');
const CloneDetector = require('./CloneDetector');
const CloneStorage = require('./CloneStorage');
const FileStorage = require('./FileStorage');

// Express and Formidable
const form = formidable({ multiples: false });

app.post('/', fileReceiver);

function fileReceiver(req, res, next) {
    form.parse(req, (err, fields, files) => {

        if (err) {
            console.log('Error receiving file:', err);
            return res.end('');
        }

        fs.readFile(files.data.filepath, { encoding: 'utf8' })
            .then(data => {
                return processFile(fields.name, data);
            })
            .catch(error => {
                console.log('Error processing file:', error);
            });
    });

    return res.end('');
}

// Start server
const server = app.listen(PORT, () => {
    console.log('Listening for files on port', PORT);
});

// Page generation for viewing current progress
function getStatistics() {
    let cloneStore = CloneStorage.getInstance();
    let fileStore = FileStorage.getInstance();

    let output =
        'Processed ' +
        fileStore.numberOfFiles +
        ' files containing ' +
        cloneStore.numberOfClones +
        ' clones.';

    return output;
}

function lastFileTimersHTML() {
    if (!lastFile) {
        return '';
    }

    let output = '<p>Timers for last file processed:</p>\n<ul>\n';

    let timers = Timer.getTimers(lastFile);

    for (let t in timers) {
        output +=
            '<li>' +
            t +
            ': ' +
            (timers[t] / 1000n) +
            ' µs</li>\n';
    }

    output += '</ul>\n';

    return output;
}

function listClonesHTML() {
    let cloneStore = CloneStorage.getInstance();
    let output = '';

    cloneStore.clones.forEach(clone => {

        output += '<hr>\n';

        output +=
            '<h2>Source File: ' +
            clone.sourceName +
            '</h2>\n';

        output +=
            '<p>Starting at line: ' +
            clone.sourceStart +
            ' , ending at line: ' +
            clone.sourceEnd +
            '</p>\n';

        output += '<ul>';

        clone.targets.forEach(target => {
            output +=
                '<li>Found in ' +
                target.name +
                ' starting at line ' +
                target.startLine +
                '</li>\n';
        });

        output += '</ul>\n';

        output +=
            '<h3>Contents:</h3>\n<pre><code>\n';

        output += clone.originalCode;

        output += '</code></pre>\n';
    });

    return output;
}

function listProcessedFilesHTML() {
    let fileStore = FileStorage.getInstance();

    let output =
        '<HR>\n<H2>Processed Files</H2>\n';

    output += fileStore.filenames.reduce(
        (out, name) => {
            out += '<li>' + name + '</li>\n';
            return out;
        },
        '<ul>\n'
    );

    output += '</ul>\n';

    return output;
}

// Original landing page
function viewClones(req, res, next) {

    let page =
        '<HTML><HEAD>' +
        '<TITLE>CodeStream Clone Detector</TITLE>' +
        '</HEAD>\n';

    page +=
        '<BODY><H1>CodeStream Clone Detector</H1>\n';

    page +=
        '<P>' +
        getStatistics() +
        '</P>\n';

    page +=
        lastFileTimersHTML() +
        '\n';

    page +=
        '<p><a href="/timers">View detailed timing statistics</a></p>\n';

    page +=
        listClonesHTML() +
        '\n';

    page +=
        listProcessedFilesHTML() +
        '\n';

    page += '</BODY></HTML>';

    res.send(page);
}

app.get('/', viewClones);

// Timing statistics
const STATS_FREQ = 100;
const URL = process.env.URL || 'http://localhost:8080/';

var lastFile = null;
const timingHistory = [];

function timerToMicroseconds(value) {

    if (typeof value !== 'bigint') {
        return Number(value) / 1000;
    }

    return Number(value) / 1000;
}

// Calculate the average of an array.
function average(values) {

    if (values.length === 0) {
        return 0;
    }

    return values.reduce(
        (sum, value) => sum + value,
        0
    ) / values.length;
}

// Calculate timing statistics for a collection of files.
function timingStatistics(entries) {

    if (entries.length === 0) {
        return {
            count: 0,
            averageTotal: 0,
            averageMatch: 0,
            averagePerLine: 0
        };
    }

    const totalTimes =
        entries.map(entry => entry.totalUs);

    const matchTimes =
        entries.map(entry => entry.matchUs);

    const perLineTimes =
        entries
            .filter(entry => entry.lines > 0)
            .map(entry => entry.perLineUs);

    return {
        count: entries.length,
        averageTotal: average(totalTimes),
        averageMatch: average(matchTimes),
        averagePerLine: average(perLineTimes)
    };
}

// Detailed timing statistics page
function timersPage(req, res, next) {

    const overall =
        timingStatistics(timingHistory);

    const last100 =
        timingStatistics(
            timingHistory.slice(-100)
        );

    const last1000 =
        timingStatistics(
            timingHistory.slice(-1000)
        );


    let page = `
<HTML>
<HEAD>
    <TITLE>CodeStream Timing Statistics</TITLE>

    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 30px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
        }

        th, td {
            border: 1px solid #999;
            padding: 6px;
            text-align: left;
        }

        th {
            background-color: #eeeeee;
        }

        .statistics {
            margin-bottom: 25px;
        }
    </style>
</HEAD>

<BODY>

<H1>CodeStream Timing Statistics</H1>


<div class="statistics">

<H2>Overall Statistics</H2>

<ul>
    <li>
        Files measured:
        ${overall.count}
    </li>

    <li>
        Average total processing time:
        ${overall.averageTotal.toFixed(2)} µs
    </li>

    <li>
        Average match detection time:
        ${overall.averageMatch.toFixed(2)} µs
    </li>

    <li>
        Average processing time per line:
        ${overall.averagePerLine.toFixed(2)} µs
    </li>
</ul>

</div>


<div class="statistics">

<H2>Last 100 Files</H2>

<ul>
    <li>
        Files:
        ${last100.count}
    </li>

    <li>
        Average total processing time:
        ${last100.averageTotal.toFixed(2)} µs
    </li>

    <li>
        Average match detection time:
        ${last100.averageMatch.toFixed(2)} µs
    </li>

    <li>
        Average processing time per line:
        ${last100.averagePerLine.toFixed(2)} µs
    </li>
</ul>

</div>


<div class="statistics">

<H2>Last 1000 Files</H2>

<ul>
    <li>
        Files:
        ${last1000.count}
    </li>

    <li>
        Average total processing time:
        ${last1000.averageTotal.toFixed(2)} µs
    </li>

    <li>
        Average match detection time:
        ${last1000.averageMatch.toFixed(2)} µs
    </li>

    <li>
        Average processing time per line:
        ${last1000.averagePerLine.toFixed(2)} µs
    </li>
</ul>

</div>


<H2>Recent Files</H2>

<table>

<tr>
    <th>File</th>
    <th>Lines</th>
    <th>Total Time (µs)</th>
    <th>Match Time (µs)</th>
    <th>Time / Line (µs)</th>
</tr>
`;


    // Show the latest 50 files.
    timingHistory
        .slice(-50)
        .forEach(entry => {

            page += `
<tr>
    <td>${entry.name}</td>
    <td>${entry.lines}</td>
    <td>${entry.totalUs.toFixed(2)}</td>
    <td>${entry.matchUs.toFixed(2)}</td>
    <td>${entry.perLineUs.toFixed(2)}</td>
</tr>
`;
        });


    page += `
</table>

<p>
    <a href="/">Back to CodeStream Clone Detector</a>
</p>

</BODY>
</HTML>
`;

    res.send(page);
}


app.get('/timers', timersPage);

// Helper functions
PASS = fn => d => {

    try {
        fn(d);
        return d;
    }

    catch (e) {
        throw e;
    }
};

function maybePrintStatistics(
    file,
    cloneDetector,
    cloneStore
) {

    if (
        0 ==
        cloneDetector.numberOfProcessedFiles %
        STATS_FREQ
    ) {

        console.log(
            'Processed',
            cloneDetector.numberOfProcessedFiles,
            'files and found',
            cloneStore.numberOfClones,
            'clones.'
        );


        let timers =
            Timer.getTimers(file);

        let str =
            'Timers for last file processed: ';


        for (let t in timers) {

            str +=
                t +
                ': ' +
                (timers[t] / 1000n) +
                ' µs ';
        }


        console.log(str);

        console.log(
            'Detailed timing statistics available at',
            URL + 'timers'
        );
    }

    return file;
}

// Processing of the file
function processFile(filename, contents) {

    let cd = new CloneDetector();

    let cloneStore =
        CloneStorage.getInstance();


    return Promise.resolve({
        name: filename,
        contents: contents
    })

        .then(
            file =>
                Timer.startTimer(
                    file,
                    'total'
                )
        )

        .then(
            file =>
                cd.preprocess(file)
        )

        .then(
            file =>
                cd.transform(file)
        )

        .then(
            file =>
                Timer.startTimer(
                    file,
                    'match'
                )
        )

        .then(
            file =>
                cd.matchDetect(file)
        )

        .then(
            file =>
                cloneStore.storeClones(file)
        )

        .then(
            file =>
                Timer.endTimer(
                    file,
                    'match'
                )
        )

        .then(file => {

            file.lineCount =
                file.lines.length;

            return file;
        })

        .then(
            file =>
                cd.storeFile(file)
        )

        .then(
            file =>
                Timer.endTimer(
                    file,
                    'total'
                )
        )

        .then(
            PASS(file => {

                lastFile = file;

                let timers =
                    Timer.getTimers(file);


                const totalUs =
                    timerToMicroseconds(
                        timers.total
                    );


                const matchUs =
                    timerToMicroseconds(
                        timers.match
                    );


                const perLineUs =
                    file.lineCount > 0
                        ? totalUs / file.lineCount
                        : 0;


                timingHistory.push({

                    name: file.name,

                    lines: file.lineCount,

                    totalUs: totalUs,

                    matchUs: matchUs,

                    perLineUs: perLineUs
                });
            })
        )


        // Print periodic statistics
        .then(
            PASS(
                file =>
                    maybePrintStatistics(
                        file,
                        cd,
                        cloneStore
                    )
            )
        )


        .catch(console.log);
}
