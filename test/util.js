'use strict'

var stream = require('stream')

module.exports = {
  createStringSource: createStringSource,
  createObjectSource: createObjectSource,
  createListener: createListener,
  createArrayListener: createArrayListener
}

function createStringSource (data) {
  var source = stream.Readable()
  var sent = false
  source._read = function () {
    if(!sent) {
      source.push(data.join('\r\n') + '\r\n')
      source.push(null)
      sent = true
    }
  }
  return source
}

function createObjectSource (data) {
  var source = stream.Readable({objectMode: true})
  var sent = false
  source._read = function () {
    if (!sent) {
      for (var i = 0; i < data.length; i++) {
        source.push(data[i])
      }
      source.push(null)
      sent = true
    }
  }
  return source
}

function createListener (write) {
  var listener = stream.Writable({objectMode: true})
  listener._write = write
  return listener
}

function createArrayListener (test) {
  var listener = stream.Writable({decodeStrings: false})
  var res = []
  listener._write = function (data, enconding, done) {
    res.push(data)
    done()
  }
  listener.on('finish', function () {
    test(res)
  })
  return listener
}