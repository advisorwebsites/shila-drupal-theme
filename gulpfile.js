/* eslint-env node */

'use strict';

// Configuration.

var config = {};
config.browserSync = {
  proxyTarget: '18check.dev.force1.awdev.ca',
  proxyReqHeaders: {
    host: 'www.shila.dev'
  }
};
config.drush = {
  alias: '@local.d8.shila'
};
config.sass = {
  srcFiles: [
    './dist/sass/*.scss'
  ],
  watchFiles: [
    './dist/sass/**/*.scss',
    './dist/_patterns/**/*.scss',
    './node_modules/shila-css/**/*.scss',
    './node_modules/foundation-sites/scss/**/*.scss'
  ],
  options: {
    includePaths: [
      './dist/sass',
      './node_modules/shila-css',
      './node_modules/breakpoint-sass/stylesheets',
      './node_modules/sass-toolkit/stylesheets',
      './node_modules/singularitygs/stylesheets',
      './node_modules/foundation-sites/scss'
    ],
    outputStyle: 'expanded'
  },
  destDir: './dist/css',
  sassDestDir: './dist/sass/'
};
config.patternsDir = './dist/_patterns';
config.imageFiles = './dist/images/**/*';
config.patternLab = {
  dir: './pattern-lab'
};
config.drupal = {
  templatesDir: './templates'
};

// Load Gulp and other tools.

const gulp = require('gulp');
const vars = require('gulp-vars');
const run = require('gulp-run');
const runSequence = require('run-sequence');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const fs = require('fs');
const sassLint = require('gulp-sass-lint');
const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');
const sassExternalVariables = require('gulp-sass-external-variables');
const argv = require('yargs').argv;
const tap = require('gulp-tap');


var variables = 'aw_plain_variables.json';
if (argv.public && argv.public.length) {
  config.sass.destDir = '../../../' + argv.public;
  variables = '../../../' + argv.public + '/aw_plain_variables.json';
  // console.log(variables);
  config.sass.options.includePaths.push(variables);
}

// Helper functions.

function isDirectory(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  }
  catch (err) {
    return false;
  }
}

// Gulp tasks.

/**
 * Sets up BrowserSync and watchers.
 */
gulp.task('watch', ['sass-change'], function () {
  browserSync.init({
    proxy: {
      target: config.browserSync.proxyTarget,
      reqHeaders: config.browserSync.proxyReqHeaders
    }
  });
  gulp.watch(config.sass.watchFiles, ['sass-change']);
  gulp.watch(config.patternsDir + '/**/*.twig', ['patterns-change']);
});

/**
 * Compiles Sass files.
 */
gulp.task('sass', function () {
  function getUserVariables(variables) {
    console.log(variables);
    return gulp.src(variables)
      .pipe(sassExternalVariables({
        sass: false
      }))
      .pipe(tap(function(file, t) {
        var theFile = file.contents.toString();
        file.contents = Buffer.from(function (theFile) {
          console.log(theFile);
          return theFile.replace('"', '');
        });
        console.log(file.contents.toString());
      }))
      .pipe(gulp.dest(config.sass.sassDestDir));
  }
  function compileSass(variablesStream) {
    return gulp.src(config.sass.srcFiles)
      .pipe(sassGlob())
      .pipe(sourcemaps.init())
      .pipe(sass(config.sass.options).on('error', sass.logError))
      .pipe(autoprefixer({
          browsers: ['last 2 versions', 'ie >= 11', 'and_chr >= 2.3'],
          cascade: false
      }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(config.sass.destDir))
      .pipe(browserSync.stream({match: '**/*.css'}));
  }
  return compileSass(getUserVariables(variables));
});

/**
 * Compiles Sass files.
 */
gulp.task('sass-ie11', function () {
  return gulp.src(config.sass.srcFiles)
    .pipe(sassGlob())
    .pipe(sourcemaps.init())
    .pipe(sass(config.sass.options).on('error', sass.logError))
    .pipe(autoprefixer({
        browsers: ['ie = 11'],
        cascade: false
    }))
    .pipe(sourcemaps.write('./'))
    .pipe(vars())
    .pipe(gulp.dest(config.sass.destDir))
    .pipe(browserSync.stream({match: '**/*.css'}));
});

/**
 * Task sequence to run when Sass files have changed.
 */
gulp.task('sass-change', function () {
  runSequence('sass', 'pl:generate');
});

/**
 * Task sequence to run when StarterKit pattern files have changed.
 */
gulp.task('patterns-change', function () {
  runSequence('pl:generate', 'bs:reload');
});

/**
 * Task sequence to run when Drupal theme templates have changed.
 */
gulp.task('templates-change', function () {
  runSequence('drush:cr', 'bs:reload');
});

/**
 * Generates Pattern Lab front-end.
 */
gulp.task('pl:generate', function () {
  if (isDirectory(config.patternLab.dir)) {
    return run('php ' + config.patternLab.dir + '/core/console --generate').exec();
  }
});

/**
 * Runs drush cr.
 */
gulp.task('drush:cr', function () {
  return run('drush ' + config.drush.alias + ' cr').exec();
});

/**
 * Calls BrowserSync reload.
 */
gulp.task('bs:reload', function () {
  browserSync.reload();
});

/**
 * Lints Sass files.
 */
gulp.task('lint:sass', function () {
  return gulp.src(config.sass.srcFiles)
    .pipe(sassLint())
    .pipe(sassLint.format());
});

/**
 * Gulp default task.
 */
gulp.task('default', ['sass']);
