module.exports = function (grunt) {
	require("load-grunt-tasks")(grunt);
	var banner = "/*! <%= pkg.name %> v<%= pkg.version %> by Will Earp - https://github.com/hexydec/hsi */\n";
	var path = require('path');

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		rollup: {
			es6: {
				options: {
					format: "es",
					sourcemap: true,
					banner: banner
				},
				src: "src/hsi.js",
				dest: "dist/hsi.js"
			},
			website: {
				options: {
					format: "es",
					sourcemap: true,
					banner: banner
				},
				src: "website.js",
				dest: "dist/website.js"
			},
			es5: {
				options: {
					format: "umd",
					sourcemap: true,
					banner: banner,
					name: "hsi"
				},
				src: "src/hsi.js",
				dest: "dist/hsi.es5.js"
			},
			// test: {
			// 	options: {
			// 		format: "es",
			// 		external: [
			// 			path.resolve(__dirname, "dist/hsi.js")
			// 		]
			// 	},
			// 	src: "src/test.js",
			// 	dest: "tests/test.js"
			// },
			// testes5: {
			// 	options: {
			// 		format: "iife",
			// 		external: [
			// 			path.resolve(__dirname, "dist/hsi.js")
			// 		],
			// 		globals: {[path.resolve(__dirname, "dist/hsi.js")]: "$"}
			// 	},
			// 	src: "src/test.js",
			// 	dest: "tests/test.es5.js"
			// }
		},
		babel: {
			es6: {
				files: {
					"dist/hsi.js": "dist/hsi.js"
				},
				options: {
					sourceMap: true
				}
			},
			es5: {
				files: {
					"dist/hsi.es5.js": "dist/hsi.es5.js",
					// "tests/test.es5.js": "tests/test.es5.js"
				},
				options: {
					sourceMap: true,
					presets: [
						["@babel/env", {
							useBuiltIns: false,
							modules: false
						}]
					]
				}
			}
		},
		terser: {
			options: {
				toplevel: true,
				mangle: {
					reserved: ["$"],
				}
			},
			es6: {
				ecma: 2015,
				mangle: {
					module: true
				},
				files: {
					"dist/hsi.min.js": "dist/hsi.js"
				}
			},
			es5: {
				ecma: 5,
				files: {
					"dist/hsi.es5.min.js": "dist/hsi.es5.js"
				}
			}
		},
		watch: {
			main: {
				files: ["website.js", "src/**/*.js", "!src/**/test.js", "gruntfile.js", "package.json"],
				tasks: ["rollup:es6", "rollup:website"]
			},
			// test: {
			// 	files: ["gruntfile.js", "package.json", "src/test.js", "src/**/test.js"],
			// 	tasks: ["rollup:test"]
			// },
			// benchmark: {
			// 	files: ["gruntfile.js", "package.json", "src/benchmark.js", "src/**/benchmark.js"],
			// 	tasks: ["rollup:benchmark"]
			// }
		}
	});
	grunt.registerTask("default", ["rollup", "babel", "terser"]);
};
