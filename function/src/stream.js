const { Buffer } = require("buffer");
const { Readable, Writable } = require("stream");

class FrameStream extends Readable {
  constructor(frames, options) {
    super(options);
    this.frames = frames;
    this.current = 0;
    this.count = frames.length;
  }

  _read() {
    if (this.current >= this.count) {
      console.log("finished reading");

      this.push(null);
      return;
    }

    console.log("read frame", this.current);

    this.push(this.frames[this.current]);
    this.current += 1;
  }
}

class BufferedStream extends Writable {
  constructor(options) {
    super(options);
    this.buffers = [];
    this.on("finish", () => {
      const data = Buffer.concat(this.buffers);
      this.emit("buffered", data);
    });
  }

  _write(chunk, encoding, callback) {
    this.buffers.push(chunk);
    callback();
  }
}

exports.FrameStream = FrameStream;
exports.BufferedStream = BufferedStream;
