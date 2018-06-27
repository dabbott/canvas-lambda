const fs = require("fs");
const fetch = require("node-fetch");

exports.installDependencies = function installDependencies(dependencies) {
  const promises = dependencies.map(dependency => {
    const { source, destination } = dependency;

    return new Promise(resolve => {
      if (fs.existsSync(destination)) {
        console.log(`${destination} OK`);
        resolve();
        return;
      }

      console.log(`Downloading ${source}.`);

      fetch(source)
        .then(response => response.buffer())
        .then(buffer => {
          fs.writeFile(destination, buffer, err => {
            if (err) {
              console.log(`Failed to download ${source}.`, err);
              return;
            }

            console.log(`Downloaded ${source} to ${destination}.`);

            fs.chmodSync(destination, 0777);

            resolve();
          });
        });
    });
  });

  return Promise.all(promises);
};
