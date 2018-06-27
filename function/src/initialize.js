process.env.PATH = process.env.PATH + ":" + "/tmp/bin";

const fs = require("fs");

const { installDependencies } = require("./install");

const BIN_DIRECTORY = "/tmp/bin";

if (!fs.existsSync(BIN_DIRECTORY)) {
  fs.mkdirSync(BIN_DIRECTORY);
}

const dependencies = [
  {
    source: process.env.FFMEG_URL,
    destination: "/tmp/bin/ffmpeg"
  },
  {
    source: process.env.FFPROBE_URL,
    destination: "/tmp/bin/ffprobe"
  }
];

const ready = installDependencies(dependencies);

ready.then(() => {
  console.log("Dependencies installed OK!");
});

exports.ready = ready;
