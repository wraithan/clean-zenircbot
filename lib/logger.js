'use strict'

var bunyan = require('bunyan')
var logger = bunyan.createLogger({
  name: 'ZenIRCBot',
  level: 'trace',
  streams: [{
    path: './irc.log'
  }]
})

module.exports = function getLogger(name, options) {
  options = options || {}
  options.file = name
  return logger.child(options)
}

module.exports.init = function init(options) {
  if (options.name === undefined) {
    options.name = 'ZenIRCBot'
  }
  logger = bunyan.createLogger(options)
}
