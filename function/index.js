// This should come first, since it modifies the path
const ffmpeg = require("fluent-ffmpeg");

const { Buffer } = require("buffer");
const AWS = require("aws-sdk");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const { BufferedStream, FrameStream } = require("./src/stream");
const { installDependencies } = require("./src/install");
const { loadImages } = require("./src/image");
const { ready } = require("./src/initialize");
const { renderFrames, renderTestFrames } = require("./src/render");

function writeVideo(frames) {
  const frameStream = new FrameStream(frames);

  console.log("frame stream", !!frameStream);

  return new Promise(resolve => {
    const outputStream = new BufferedStream();

    outputStream.on("buffered", buffer => {
      console.log("output ready");
      resolve(buffer);
    });

    ffmpeg()
      .input(frameStream)
      // .inputOptions(["-r 30", "-f image2pipe"])
      .inputOptions(["-r 30"])
      .format("mp4")
      .videoCodec("libx264")
      .on("end", function() {
        console.log("finished writing video");
      })
      .on("error", function(err) {
        // callback(err);
        console.log("an error happened: " + err.message);
      })
      .outputOptions(["-movflags frag_keyframe+empty_moov"])
      .output(outputStream, { end: true })
      .run();
  });
}

function joinVideo(frames) {
  const frameStream = new FrameStream(frames);

  console.log("frame stream", !!frameStream);

  return new Promise((resolve, reject) => {
    const id = crypto.randomBytes(8).toString("hex");

    const tmp = os.tmpdir();

    const outputFile = path.join(tmp, `video-${id}.mp4`);

    const cmd = frames.reduce((acc, frame, index) => {
      const videoPath = path.join(tmp, `video-${id}-${index}.mp4`);
      console.log("merging chunk", videoPath);
      fs.writeFileSync(videoPath, frame);
      return acc.input(videoPath).inputFormat("mp4");
    }, ffmpeg());

    cmd
      .inputOptions(["-r 30"])
      .format("mp4")
      .videoCodec("libx264")
      .on("end", function() {
        console.log("finished writing video", outputFile);
        fs.readFile(outputFile, (err, buffer) => {
          if (err) {
            console.log("err reading video", err);
            reject(err);
            return;
          }
          console.log("read video file we just wrote");
          resolve(buffer);
        });
      })
      .on("error", function(err) {
        // callback(err);
        console.log("an error happened: " + err.message, outputFile);
      })
      .outputOptions(["-movflags frag_keyframe+empty_moov"])
      // .output(outputStream, { end: true })
      // .run();
      .mergeToFile(outputFile, "/tmp");
  });
}

function chunkFrames(startFrame, endFrame, chunkSize) {
  const chunks = [];

  while (startFrame <= endFrame) {
    chunks.push({
      startFrame,
      endFrame: Math.min(startFrame + chunkSize, endFrame)
    });

    startFrame += chunkSize + 1;
  }

  return chunks;
}

function delegateRendering(
  event,
  masterStartFrame,
  masterEndFrame,
  workerFrameCount
) {
  const promises = chunkFrames(
    masterStartFrame,
    masterEndFrame,
    workerFrameCount
  ).map((chunk, index) => {
    console.log("master chunk", index, chunk);

    return new Promise((resolve, reject) => {
      const { startFrame, endFrame } = chunk;

      const lambda = new AWS.Lambda({ region: "us-west-1" });
      const workerPayload = JSON.parse(JSON.stringify(event));

      Object.assign(workerPayload, {
        role: "worker",
        startFrame,
        endFrame
      });

      lambda.invoke(
        {
          FunctionName: "testCanvasLambda",
          Payload: JSON.stringify(workerPayload, null, 2) // pass params
        },
        function(err, data) {
          console.log("master received response", "error?", !!err);
          if (err) {
            console.log("master error response", err);
            reject(err);
            return;
          }

          const { Payload } = data;
          const { body } = JSON.parse(Payload);

          console.log("master payload length", body.length);

          resolve(Buffer.from(body, "base64"));
        }
      );
    });
  });

  return Promise.all(promises);
}

exports.handler = (event, context, callback) => {
  console.log("event", event);
  // console.log("context", context);
  // console.log("body", event.body);

  // callback(null, "OK");
  // return;

  let {
    animation: animationData,
    startFrame = 0,
    endFrame,
    role,
    workerFrameCount = 30
  } = event;

  const { op, assets } = animationData;

  endFrame = endFrame ? Math.min(op, endFrame) : op;

  const imagePaths = assets
    ? assets.filter(asset => !!asset.p).map(asset => asset.p)
    : [];

  if (role === "master") {
    console.log("master starting");
    Promise.all([
      delegateRendering(event, startFrame, endFrame, workerFrameCount),
      ready
    ]).then(([videos]) => {
      console.log("master joining", videos.length, "videos");

      joinVideo(videos).then(buffer => {
        console.log("master sending response");

        callback(null, {
          isBase64Encoded: true,
          statusCode: 200,
          headers: {
            "Content-Type": "video/mp4"
          },
          body: buffer.toString("base64")
        });
      });
    });
  } else {
    console.log("worker starting");
    Promise.all([loadImages(imagePaths), ready]).then(([images]) => {
      // console.log("images", images);

      const frames = renderFrames(animationData, images, startFrame, endFrame);
      // const frames = renderTestFrames();

      console.log("worker created", frames.length, "frames");

      writeVideo(frames).then(buffer => {
        console.log("worker sending response");

        callback(null, {
          isBase64Encoded: true,
          statusCode: 200,
          headers: {
            "Content-Type": "video/mp4"
          },
          body: buffer.toString("base64")
        });
      });
    });
  }
};
