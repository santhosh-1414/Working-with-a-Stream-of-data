# Working with a Stream of Data

**Course:** PA2577 – Applied Computing and Big Data  
**Assignment:** Working with a Stream of Data

## Project overview

This repository contains the **CodeStreamConsumer** component of the Code Stream Clone Detector. The consumer is a Node.js application that receives Java source files, processes them, searches for matching code fragments in previously processed files, and reports detected clones and processing times.

The assignment uses a separate **CodeStreamGenerator** to send source files to the consumer. The generator is not included in this repository; this repository contains the consumer code and the assignment report.

## What the application does

1. **Receives source files** – accepts HTTP POST requests containing a file and its name.
2. **Preprocesses Java code** – removes blank lines and comments before comparison.
3. **Creates chunks** – divides the remaining source lines into chunks. The default chunk size is five lines.
4. **Detects code clones** – compares chunks in the incoming file with chunks from files already processed, then expands and consolidates matching clone candidates.
5. **Displays results** – shows processed-file and clone counts, detected clone details, and processing-time statistics.

## Timing and results pages

When the application is running, open these pages in a browser:

| Page | Description |
|---|---|
| `/` | Main page with processed-file count, detected clones, and timing information for the last processed file |
| `/timers` | Detailed timing statistics, including overall averages, averages for the latest 100 and 1,000 files, and timings for recent files |

The timing measurements include total processing time, clone-matching time, and total processing time per source line.

## Technologies

- **Node.js** – application runtime
- **JavaScript** – implementation language
- **Express** – HTTP server and routes
- **Formidable** – handling uploaded files
- **Docker** – containerising the consumer

## Repository structure

```text
.
├── CodeStreamConsumer/
│   ├── src/
│   │   ├── Clone.js
│   │   ├── CloneDetector.js
│   │   ├── CloneStorage.js
│   │   ├── FileStorage.js
│   │   ├── SourceLine.js
│   │   ├── Timer.js
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
├── BDA_Assign-2_Report .pdf
├── .gitignore
└── README.md
```

## Run locally

### Prerequisites

- Node.js (the supplied Dockerfile uses Node.js 18)
- npm

### Install dependencies

Open a terminal in the repository and run:

```bash
cd CodeStreamConsumer
npm install
```

### Start the consumer

```bash
npm run dev
```

The application listens on port **3000**. Open:

- Main page: http://localhost:3000/
- Timing statistics: http://localhost:3000/timers

The consumer expects Java source files to be sent to its HTTP POST endpoint by a compatible CodeStreamGenerator.

## Run with Docker

From the repository root, build the image:

```bash
docker build -t codestream-consumer ./CodeStreamConsumer
```

Start the container and map host port 8080 to the application's port 3000:

```bash
docker run --rm -p 8080:3000 codestream-consumer
```

Then open:

- Main page: http://localhost:8080/
- Timing statistics: http://localhost:8080/timers

## Configuration

The clone detector uses a default chunk size of **5 lines**. The chunk size can be changed with the `CHUNKSIZE` environment variable.

For example, when running locally:

```bash
CHUNKSIZE=10 npm run dev
```

## Notes and current limitations

- The consumer processes Java files with the `.java` extension.
- Processed files, detected clones, and timing history are kept in memory while the application runs. They are not persisted between restarts.
- The CodeStreamGenerator is a separate assignment component and is not part of this repository.

## Assignment report

The accompanying report contains the implementation discussion, observations, and answers to the assignment questions:

[View the Assignment 2 report](<BDA_Assign-2_Report%20.pdf>)

---

**PA2577 – Applied Computing and Big Data**
