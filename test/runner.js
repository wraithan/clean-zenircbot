'use strict'

var test = require('tape')
var colorize = require('colortape')

test.createStream().pipe(new colorize()).pipe(process.stdout)

require('./parser.tap.js')
require('./writer.tap.js')