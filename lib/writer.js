var stream = require('stream')
var util = require('util')
var log = require('./logger')('writer.js')

var Writer = module.exports = function Writer() {
  stream.Transform.call(this, {objectMode: true})

  this._transform = function (object, encoding, done) {
    this.dispatch(object)
    done()
  }

  this._flush = function (done) {
    done()
  }
}

util.inherits(Writer, stream.Transform)

Writer.prototype.dispatch = function (object) {
  if (object.command === 'connect') {
    this.push('NICK ' + object.nick + '\r\n')
    this.push('USER ' + object.username + ' 8 * :' + object.realname + '\r\n')
  } else if (object.command === 'raw') {
    this.push(object.message + '\r\n')
  }
  log.debug(object)
}