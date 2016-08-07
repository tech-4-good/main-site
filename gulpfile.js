/* eslint-disable no-console */

'use strict';

const fs = require('fs'),
	rimraf = require('rimraf'),
	gulp = require('gulp'),
	filter = require('gulp-filter'),
	changed = require('gulp-changed'),
	order = require('gulp-order'),
	dest = require('gulp-dest'),
	babel = require('gulp-babel'),
	concat = require('gulp-concat'),
	postcss = require('gulp-postcss'),
	autoprefixer = require('autoprefixer'),
	pxtorem = require('postcss-pxtorem'),
	sass = require('gulp-sass'),
	cssnano = require('gulp-cssnano'),
	eslint = require('gulp-eslint'),
	uglify = require('gulp-uglify'),
	imagemin = require('gulp-imagemin'),
	livereload = require('gulp-livereload'),
	sourcemaps = require('gulp-sourcemaps'),
	reporter = require('postcss-reporter'),
	scss = require('postcss-scss'),
	stylelint = require('stylelint'),
	rmFile = function(file) {
		/* eslint-disable no-unused-vars */
		fs.stat(file, function(err, stats) {
			if (!err) {
				fs.unlink(file);
			}
		});
		/* eslint-enable no-unused-vars */
	};

gulp.task('css-lint', function() {
	var processors = [
		stylelint(),
		reporter({
			clearMessages: false,
			throwError: true
		})
	];

	return gulp.src(['src/sass/**/*.scss', '!src/sass/vendor/**/*.scss'])
		.pipe(changed('css'))
		.pipe(postcss(processors, { syntax: scss }))
		.on('error', function(error) {
			error.message = '\u001b[31m\u001b[1mPlease address Stylelint issues before continuing.\u001b[22m\u001b[39m';
			error.showStack = false;
			error.showProperties = false;
		});
});

gulp.task('css-compile', ['css-lint'], function() {
	var processors = [
		autoprefixer({
			browsers: ['last 2 versions', 'IE 9', 'IE 8'],
			cascade: false
		}),
		pxtorem({
			prop_white_list: []
		})
	];

	return gulp.src('src/sass/**/*.scss')
		.pipe(changed('css'))
		.pipe(sourcemaps.init())
		.pipe(sass()
			.on('error', sass.logError))
		.pipe(cssnano({
			autoprefixer: false,
			mergeLonghand: false,
			zindex: false,
			convertValues: false
		}))
		.pipe(postcss(processors))
		.pipe(sourcemaps.write('public/assets/css'))
		.pipe(gulp.dest('public/assets/css'))
		.pipe(filter('**/*.css'))
		.pipe(livereload());
});

gulp.task('js-lint', function() {
	return gulp.src(['src/js/**/*.js', '!src/js/lib/**/*.js'])
		.pipe(changed('js'))
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failOnError())
		.on('error', function() {
			var files = [
				'public/assets/js/scripts.js',
				'public/assets/js/min/scripts.min.js',
				'public/assets/js/min/scripts.min.js.map'
			];

			for (var i = 0; i < files.length; i++) {
				rmFile(files[i]);
			}
		});
});

gulp.task('js-compile', ['js-lint'], function() {
	return gulp.src('src/js/**/*.js')
		.pipe(sourcemaps.init())
		.pipe(changed('js'))
		.pipe(order([
			'lib/**/*.js',
			'env.js',
			'app/**/*.js',
			'template/**/*.js',
			'app.js'
		]))
		.pipe(babel())
		.pipe(concat('scripts.js'))
		.pipe(gulp.dest('public/assets/js'))
		// .pipe(uglify({ mangle: false }))
		// .pipe(dest('public/assets/js/min', { ext: '.min.js' }))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('.'))
		.pipe(livereload());
});

gulp.task('images-compile', function() {
	rimraf('images', function() {
		return gulp.src('src/images/**/*{.jpg,.jpeg,.png,.svg}')
			.pipe(imagemin({
				progressive: true
			}))
			.on('error', function(error) {
				console.error(error);

				this.emit('end');
			})
			.pipe(gulp.dest('public/assets/images'))
			.pipe(livereload());
	});
});

gulp.task('images-watch', function() {
	return gulp.src('src/images/**/*{.jpg,.jpeg,.png,.svg,.gif}')
		.pipe(changed('public/assets/images'))
		.pipe(imagemin({
			progressive: true
		}))
		.on('error', function(error) {
			console.error(error);

			this.emit('end');
		})
		.pipe(gulp.dest('public/assets/images'))
		.pipe(livereload());
});

gulp.task('watch', function() {
	livereload.listen();
	gulp.watch('src/sass/**/*.scss', ['css-compile']);
	gulp.watch('src/js/**/*.js', ['js-compile']);
	gulp.watch('src/images/**/*{.jpg,.jpeg,.png,.svg,.gif}', ['images-watch']);
});

gulp.task('default', ['watch']);
gulp.task('compile', ['css-compile', 'js-compile', 'images-compile']);
