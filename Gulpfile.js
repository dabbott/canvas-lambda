var gulp = require("gulp");
var lambda = require("gulp-awslambda");
var zip = require("gulp-zip");

var functionName = process.env.RENDERER_LAMBDA_NAME;

/**
 * For uploading the first time.
 * Subsequent updates on a function that has already been created only
 * require the name of the function (see task below).
 */
var lambda_params = {
  FunctionName: functionName,
  Role: process.env.RENDERER_LAMBDA_ROLE,
  Runtime: "nodejs6.10"
};

var opts = {
  region: "us-west-1"
};

gulp.task("update", function() {
  return gulp
    .src("function/**/*")
    .pipe(zip("archive.zip"))
    .pipe(lambda(functionName, opts))
    .pipe(gulp.dest("."));
});

gulp.task("new", function() {
  return gulp
    .src("function/**/*")
    .pipe(zip("archive.zip"))
    .pipe(lambda(lambda_params, opts))
    .pipe(gulp.dest("."));
});
