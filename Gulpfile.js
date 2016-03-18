'use strict';

var gulp            = require('gulp');
var sass            = require('gulp-sass');
var clean           = require('gulp-clean');
var inject          = require('gulp-inject');
var gulpif          = require('gulp-if');
var useref          = require('gulp-useref');
var uglify          = require('gulp-uglify');
var wiredep         = require('wiredep').stream;
var minifyCss       = require('gulp-minify-css');
var browserSync     = require('browser-sync').create();
var runSequence     = require('run-sequence');
var templateCache   = require('gulp-angular-templatecache');
var angularFilesort = require('gulp-angular-filesort');

gulp.task('develop-server', function(){
  browserSync.init({
    server: {
      baseDir: "./",
      index: "index.html"
    },
    port: 8000,
    logLevel: "info"
  });
});

// Cocatenates AngularJS templates in a JavaScript
// to be used by $templateCache.
gulp.task('templates', function(){
  gulp.src(['app/views/*.html'])
      .pipe(templateCache({
          filename: 'mainTemplates.js',
          root: '/views/',
          // module: 'appName.mainTemplates',
          standalone: true
      }))
      .pipe(gulp.dest('app/js'));
});

//Inject all JavaScript and CSS resources in index.html
gulp.task('inject', function(){
  return gulp.src('index.html', {cwd: 'app'})
              .pipe(inject(gulp.src(['app/js/*.js'])
                                .pipe(angularFilesort()),
                                {
                                  ignorePath:'/app',
                                }
                    )
              )
              .pipe(inject(gulp.src(['app/css/*.css']),
                            {
                              read: false,
                              ignorePath: '/app'
                            }
                    )
              )
              .pipe(gulp.dest('app'));
});

//Inject Bower depencies in index.html
gulp.task('wiredep', function(){
  gulp.src('app/index.html')
      .pipe(wiredep(
              {
                directory: 'app/lib'
              }
            )
      )
      .pipe(gulp.dest('app'));
});

//Process scss files and reload browser.
gulp.task('sass', function(){
  gulp.src('./app/sass/**/*.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(gulp.dest('app/css'))
      .pipe(connect.reload());
})

//Reload browser when there is some change on some CSS file
gulp.task('css', function(){
  gulp.src('./app/css/*.css')
      .pipe(connect.reload());
});

//Reload brower when there is some change on some HTML file
gulp.task('html', function(){
  gulp.src('./app/**/*.html')
      .pipe(connect.reload());
});

//Concatenates and uglify our javascript files.
gulp.task('js', function(){
    return gulp.src(['app/js/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(concat('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('app/js'));
});

// Compress js and css files linked in index.html.
gulp.task('compress', function(){
    gulp.src('app/index.html')
        .pipe(useref())
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulp.dest('build'));
});

//Copy files needed in production
gulp.task('copy', function(){
    gulp.src('app/index.html')
        .pipe(useref())
        .pipe(gulp.dest('build'));
    gulp.src('app/images/*')
        .pipe(gulp.dest('build/images'));
    gulp.src('app/fonts/*')
        .pipe(gulp.dest('build/fonts'));
    gulp.src('app/lib/bootstrap/fonts/*')
        .pipe(gulp.dest('build/fonts'));
});

//Watch code changes and launch related tasks
gulp.task('watch', function(){
  gulp.watch(['./app/**/*.html'], ['templates', 'html']);
  gulp.watch(['./app/css/*.css'], ['css']);
  gulp.watch(['./app/sass/**/*.scss'], ['sass']);
  gulp.watch(['./app/js/*.js', './app/css/*.css'], ['inject']);
  gulp.watch(['./bower.json'], ['wiredep']);
});

gulp.task('build-clean', function() {
    return gulp.src('./build').pipe(clean());
//  ^^^^^^
//   This is the key here, to make sure tasks run asynchronously!
});

gulp.task('default', function(callback){
  runSequence('templates',
              'inject',
              'wiredep',
              'watch',
              'develop-server',
              callback);
});

gulp.task('build', function(callback){
    runSequence('build-clean',
                'templates',
                'compress',
                'copy',
                callback);
});
