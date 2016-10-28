'use strict';
const gulp = require('gulp');
const buddyjs = require('gulp-buddy.js');
const gulpNSP = require('gulp-nsp');
const istanbul = require('gulp-istanbul');
const jshint = require('gulp-jshint');
const jscs = require('gulp-jscs');
const mocha = require('gulp-mocha');

const SOURCE_CODE = ['./lib/*.js'];
const TESTS = ['./test/*.js'];
const MISC = ['./gulpfile.js'];
const ALL_CODE = SOURCE_CODE.concat(TESTS).concat(MISC);

gulp.task('nsp', function (cb) {
  gulpNSP({ package: __dirname + '/package.json' }, cb);
});

gulp.task('jshint', function () {
  return gulp.src(ALL_CODE)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('jscs', function () {
  return gulp.src(ALL_CODE)
    .pipe(jscs())
    .pipe(jscs.reporter())
    .pipe(jscs.reporter('fail'));
});

gulp.task('buddyjs', function () {
  return gulp.src(SOURCE_CODE)
    .pipe(buddyjs({
      ignore: [0, 1, 2, 10],
      reporter: 'detailed',
    }));
});

gulp.task('pp', ['jshint', 'jscs', 'buddyjs']);

gulp.task('pre-test', function () {
  return gulp.src(SOURCE_CODE)
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test', 'pp'], function () {
  return gulp.src(TESTS)
    .pipe(mocha())
    .pipe(istanbul.writeReports())
    .pipe(istanbul.enforceThresholds({ thresholds: { statements: 80, lines: 80, functions: 80, branches: 40 } }));
});

gulp.task('build', ['test']);
gulp.task('release', ['build', 'nsp']);

gulp.task('default', ['build']);
