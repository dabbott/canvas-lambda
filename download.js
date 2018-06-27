const program = require("commander");

const { Buffer } = require("buffer");
const AWS = require("aws-sdk");
const fs = require("fs");
const untildify = require("untildify");
const glob = require("glob");
const throttledQueue = require("throttled-queue");

let positionalArgs = [];

program
  .version("0.1.0")
  .arguments("<animation-files>") // Must be quoted for glob to expand, rather than the shell
  .option("-s, --start-frame <n>", "Render starting from this frame", parseInt)
  .option("-e, --end-frame <n>", "Render ending on this frame", parseInt)
  .option("-r, --retry-count <n>", "Number of times to retry", parseInt)
  .option("--speed <n>", "Number of conversions per minute", parseInt)
  .option(
    "-w, --worker-frame-count <n>",
    "Max frames a worker should render",
    parseInt
  )
  .action((...args) => {
    positionalArgs = args;
  })
  .parse(process.argv);

const [inputFiles] = positionalArgs;
const {
  startFrame,
  endFrame,
  workerFrameCount,
  retryCount = 3,
  speed = 100
} = program;

if (!inputFiles) {
  console.log("Missing input files!");
  program.help();
}

AWS.config.update({ region: "us-west-1" });

const resolved = untildify(inputFiles);
const expanded = glob.sync(resolved);

const files = expanded.filter(file => {
  const outputFile = file.replace(".json", ".mp4");
  return !fs.existsSync(outputFile);
});

console.log(`Converting ${files.length} files.`);
console.log(
  files
    .slice(0, 10)
    .concat(files.length > 10 ? [`and ${files.length - 10} more...`] : [])
);

if (expanded.length !== files.length) {
  console.log(`Skipping ${expanded.length - files.length} files.`);
}

let initialTime = 5;
const intervalId = setInterval(() => {
  console.log(`${initialTime}s elapsed`);
  initialTime += 5;
}, 5000);

function convertFile(file, requestIndex) {
  const outputFile = file.replace(".json", ".mp4");

  if (fs.existsSync(outputFile)) {
    console.log(`[Skipping] (${requestIndex}) ${file}`);
    return Promise.resolve(outputFile);
  }

  var lambda = new AWS.Lambda();

  const requestPayload = {
    animation: JSON.parse(fs.readFileSync(file)),
    role: "master"
  };

  if (typeof startFrame === "number") {
    requestPayload.startFrame = startFrame;
  }
  if (typeof endFrame === "number") {
    requestPayload.endFrame = endFrame;
  }
  if (typeof workerFrameCount === "number") {
    requestPayload.workerFrameCount = workerFrameCount;
  }

  var params = {
    FunctionName: process.env.RENDERER_LAMBDA_NAME,
    Payload: JSON.stringify(requestPayload)
  };

  // console.log("Converting", file);

  if (typeof startFrame === "number" || typeof endFrame === "number") {
    console.log("Frames", startFrame || 0, "-", endFrame || "end");
  }

  function invoke(attempt) {
    return new Promise((resolve, reject) => {
      // console.log("Invoking lambda", file);
      lambda.invoke(params, function(err, data) {
        // console.log(
        //   `[Response] (${requestIndex}) ${file} ${err ? "ERROR" : "OK"}`
        // );

        if (err) {
          console.log(err, err.stack); // an error occurred
          reject(err);
          return;
        }

        // console.log("data", data);

        const { Payload } = data;

        if (Payload === "null") {
          // console.log(`[Failed] (${requestIndex}) ${file} - Null payload`);
          reject(new Error("Null payload"));
          return;
        }

        const { body, errorMessage } = JSON.parse(Payload);

        if (body) {
          // console.log(`[Length] (${requestIndex}) ${file} ${body.length}`);

          const buffer = Buffer.from(body, "base64");

          fs.writeFileSync(outputFile, buffer);

          // console.log(`[Wrote] (${requestIndex}) ${outputFile}`);

          resolve(outputFile);
        } else {
          // console.log("Failed to render", file);
          // console.log(data);
          // { StatusCode: 200,
          //   FunctionError: 'Unhandled',
          //   Payload: '{"errorMessage":"RequestId: a..............................b Process exited before completing request"}' }

          reject(new Error(errorMessage || "Unknown error"));
        }
      });
    });
  }

  return new Promise((resolve, reject) => {
    function tryInvoke(attempt, e) {
      if (attempt >= retryCount) {
        reject(new Error(e));
        return;
      }

      if (attempt > 0) {
        console.log(
          `[Retry ${attempt}] (${requestIndex}) ${file} (${e && e.message})`
        );
      }

      invoke(attempt).then(resolve, e => {
        tryInvoke(attempt + 1, e);
      });
    }

    return tryInvoke(0, null);
  });
}

function convertFiles(files) {
  const throttle = throttledQueue(speed, 1000 * 60, true);
  let startedCount = 0;

  const promises = files.map(file => {
    return new Promise((resolve, reject) => {
      throttle(async () => {
        startedCount++;
        let requestIndex = startedCount;

        console.log(`[Starting] (${requestIndex}) ${file}`);

        try {
          const outputFile = await convertFile(file, requestIndex);

          console.log(`[Finished] (${requestIndex}) ${file}`);

          resolve(outputFile);
        } catch (e) {
          console.log(
            `>>> [Aborting] (${requestIndex}) ${file} -- ${e && e.message}`
          );
          reject(e);
        }
      });
    });
  });

  return promises;
}

function main() {
  const promises = convertFiles(files);

  Promise.all(promises.map(p => p.catch(e => e))).then(results => {
    clearInterval(intervalId);
    console.log("\n----------\n");
    console.log("Rendered", files.length, "videos!");

    console.log(
      `${results.filter(x => !(x instanceof Error)).length} Converted`
    );
    console.log(`${results.filter(x => x instanceof Error).length} Failed`);

    // Throttle prevents node from quitting
    process.exit(1);
  });
}

main();
