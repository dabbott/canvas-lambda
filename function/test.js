require("./index.js").handler({}, {}, function(err, data) {
  if (err) {
    console.log("err", err);
  } else {
    console.log("success!", data);
  }
});
