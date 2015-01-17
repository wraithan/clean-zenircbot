'use strict'

var dashdash = require('dashdash')

var options = [
  {
    names: ['help', 'h'],
    type: 'bool',
    help: 'Print this help and exit'
  }
]

var parser = dashdash.createParser({options: options})

module.exports = function(args) {
  var opts
  try {
    opts = parser.parse(args)
  } catch (e) {
    console.error('foo: error: %s', e.message)
    process.exit(1)
  }

  if (opts.help) {
    var help = parser.help({includeEnv: true}).trimRight()
    console.log('usage: node index.js [OPTIONS]\n' +
                'options:\n' + help)
    process.exit()
  }

  return opts;
}