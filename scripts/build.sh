#!/usr/bin/env bash
uglifyjs ./lib/Tpa.js -m -c warnings=false --define PRODUCTION -o ./lib/uglify/Tpa.js
uglifyjs ./lib/N.js  -m -c warnings=false --define PRODUCTION -o ./lib/uglify/N.js
browserify ./lib/uglify/Tpa.js --standalone Tpa -o ./lib/tpa.min.js