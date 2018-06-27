const Canvas = require("canvas");

const bodymovin = require("../vendor/bodymovin");

exports.renderFrames = function renderFrames(
  animationData,
  images,
  startFrame,
  endFrame
) {
  const canvas = new Canvas();
  canvas.width = 800;
  canvas.height = 800;

  const context = canvas.getContext("2d");

  const animationItem = bodymovin.loadAnimation({
    renderer: "canvas",
    loop: false,
    autoplay: false,
    animationData: animationData,
    images,
    rendererSettings: {
      context: context,
      clearCanvas: false
    }
  });

  const frames = [];

  // for (let i = 0; i <= Math.min(animationItem.totalFrames, 5); i++) {
  for (let i = startFrame; i <= endFrame; i++) {
    // context.fillStyle = "transparent";
    // context.fillRect(0, 0, canvas.width, canvas.height);
    context.clearRect(0, 0, canvas.width, canvas.height);

    animationItem.goToAndStop(i, true);

    frames.push(canvas.toBuffer());
  }

  return frames;
};

function drawCanvas(iteration) {
  const canvas = new Canvas();
  canvas.width = 100;
  canvas.height = 100;

  const context = canvas.getContext("2d");
  context.fillStyle = "red";
  context.fillRect(0, 0, iteration, iteration);
  context.fillStyle = "green";
  context.fillRect(iteration, 0, iteration, iteration);
  context.fillStyle = "blue";
  context.fillRect(0, iteration, iteration, iteration);
  context.fillStyle = "yellow";
  context.fillRect(iteration, iteration, iteration, iteration);

  return canvas.toBuffer();
}

function drawFrames(max = 30) {
  const frames = [];

  for (let i = 0; i <= max; i++) {
    frames.push(drawCanvas(i));
  }

  return frames;
}

exports.renderTestFrames = drawFrames;
