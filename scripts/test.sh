#!/bin/bash
set -ev
env ALL_BASES="yes" mocha test/
if [[ $TRAVIS_NODE_VERSION == 4* ]]; then
    env ALL_BASES="no" istanbul cover ./node_modules/mocha/bin/_mocha --report lcovonly -- -R spec
    cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js
    rm -rf ./coverage
fi