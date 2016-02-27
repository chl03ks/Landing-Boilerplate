'use strict';

var gulp           = require('gulp');
var sass           = require('gulp-sass');
var minifyCss      = require('gulp-minify-css');
var gulpFilter     = require('gulp-filter');
var uglify         = require('gulp-uglify');
var concat         = require('gulp-concat');
var mainBowerFiles = require('main-bower-files');
var flatten        = require('gulp-flatten');
var rename         = require('gulp-rename');
var sourcemaps     = require('gulp-sourcemaps');
var autoprefixer   = require('gulp-autoprefixer');
var connectPHP     = require('gulp-connect-php');
var jade           = require('gulp-jade');
var express        = require('express');
var app            = express();
var gutil          = require('gulp-util');
var livereload     = require('gulp-livereload');
var tinylr         = require('tiny-lr');
var path           = require('path');
var imagemin       = require('gulp-imagemin');
var pngquant       = require('imagemin-pngquant');

var server    = tinylr();
var dest_path = 'dist';
var inputcss  = './public/sass/**/*.scss';
var outputcss = './dist/css';
var port      = 3000;


var sassOptions = {
  errLogToConsole: true,
  outputStyle: 'expanded'
};


gulp.task('express', function() {
  app.use(express.static(path.resolve('./dist')));
  app.listen(port);
  gutil.log('Listening on port:' + port );
});


gulp.task('images', function (){
    return gulp.src('public/img/*')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [
                {removeViewBox: false},
                {cleanupIDs: false}
            ],
            use: [pngquant()]
        }))
        .pipe(gulp.dest('dist/img'))
        .pipe( livereload( server ));
});
// run this task by typing in gulp jade in CLI

gulp.task('templates', function() {
  return gulp.src('public/*.jade')
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest('dist/'))
    .pipe( livereload( server ));
});


gulp.task('sass', function () {
  return gulp
    .src(inputcss)
    .pipe(sourcemaps.init())
    .pipe(sass(sassOptions).on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(autoprefixer())
    .pipe(minifyCss())
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(gulp.dest(outputcss))
    .pipe( livereload( server ));
});

gulp.task('js', function() {
  return gulp.src('public/js/**/*.js')
    .pipe( uglify() )
    .pipe( concat('all.min.js'))
    .pipe( gulp.dest('dist/js/'))
    .pipe( livereload( server ));
});

// grab libraries files from bower_components, minify and push in /public
gulp.task('bower', function() {
  var jsFilter = gulpFilter('*.js', {restore: true}),
      cssFilter = gulpFilter('*.css', {restore: true}),
      fontFilter = gulpFilter(['*.eot', '*.woff', '*.svg', '*.ttf'], {restore: true});

  return gulp.src(mainBowerFiles())

  // grab vendor js files from bower_components, minify and push in /dist
  .pipe(jsFilter)
  .pipe(concat('vendor.js'))
  .pipe(uglify())
  .pipe(rename({
    suffix: ".min"
  }))
  .pipe(gulp.dest(dest_path + '/js/'))
  .pipe(jsFilter.restore)

  // grab vendor css files from bower_components, minify and push in /dist
  .pipe(cssFilter)
  .pipe(concat('vendor.css'))
  .pipe(minifyCss())
  .pipe(rename({
      suffix: ".min"
  }))
  .pipe(gulp.dest(dest_path + '/css/'))
  .pipe(cssFilter.restore)

  // grab vendor font files from bower_components and push in /dist
  .pipe(fontFilter)
  .pipe(flatten())
  .pipe(gulp.dest(dest_path + '/fonts/'))
  .pipe( livereload( server ));

});

gulp.task('watch', function () {
  server.listen(35729, function (err) {
    if (err) {
      return console.log(err);
    }

    gulp.watch('public/sass/**/*.scss',['sass']);

    gulp.watch('public/js/**/*.js',['js']);

    gulp.watch('public/**/*.jade',['templates']);

    gulp.watch('public/img/**',['images']);

  });
});

// Default Task
gulp.task('default', ['js','sass','templates','watch', 'bower','images','express']);
