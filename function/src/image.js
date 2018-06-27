// const gm = require("gm").subClass({ imageMagick: true });
const fetch = require("node-fetch");
const fs = require("fs");
const { Image } = require("canvas");

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    function cleanup() {
      image.onload = null;
      image.onerror = null;
    }

    image.onload = () => {
      cleanup();
      resolve(image);
    };
    image.onerror = err => {
      cleanup();
      reject(err);
    };

    if (src.startsWith("http://") || src.startsWith("https://")) {
      fetch(src)
        .then(response => response.buffer())
        .then(data => {
          image.src = data;
        })
        .catch(err => {
          console.log("Failed to fetch image file", src);
          reject(err);
        });
    } else if (src.startsWith("data:image/png;base64,")) {
      image.src = src;
    } else {
      // Replace file protocol if it exists
      fs.readFile(src.replace("file://", ""), (err, data) => {
        if (err) {
          console.log("Failed to read image file", src);
          reject(err);
          return;
        }

        image.src = data;
      });
    }
  });
}

exports.loadImages = function loadImages(imagePaths) {
  return new Promise(resolve => {
    const loadedImages = {};
    Promise.all(imagePaths.map(loadImage)).then(images => {
      imagePaths.forEach((imagePath, index) => {
        loadedImages[imagePath] = images[index];
      });
      resolve(loadedImages);
    });
  });
};

// function fetchImage(url) {
//   return fetch(url).then(response => response.buffer());
// }

// callback(null, image);
// fetchImage(
//   "..."
// ).then(buffer => {
//   gm(buffer, "img.jpg").size((err, size) => {
//     if (err) {
//       callback(err);
//       return;
//     }
//     const { width, height } = size;
//     const length = Math.min(width, height);
//     const destImagePath = path.join(os.tmpdir(), "image.png");
//     gm(buffer, "img.jpg")
//       .crop(length, length)
//       .resize(600, 600)
//       .write(destImagePath, function(err) {
//         if (err) {
//           callback(err);
//           return;
//         }
//         const destVideoPath = path.join(os.tmpdir(), "video.m4v");
//         var proc = ffmpeg(destImagePath)
//           // loop for 5 seconds
//           .loop(5)
//           // using 25 fps
//           .fps(25)
//           // setup event handlers
//           .on("end", function() {
//             callback(null, destVideoPath);
//             console.log("file has been converted succesfully");
//           })
//           .on("error", function(err) {
//             callback(err);
//             console.log("an error happened: " + err.message);
//           })
//           // save to file
//           .save(destVideoPath);
//       });
//     // .toBuffer("PNG", (err, buffer) => {
//     //   callback(null, buffer.toString("base64"));
//     // });
//   });
// });
