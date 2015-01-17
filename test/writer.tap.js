'use strict'

var test = require('tape').test
var Writer = require('../lib/writer')
var util = require('./util')

test('writer tests', function (t) {
  t.test('connect', function (t) {
    var writer = new Writer()
    var source = util.createObjectSource([{
      command: 'connect',
      nick: 'CleanZenBot',
      username: 'ZenIRCBot',
      realname: 'ZenIRCBot V3'
    }])
    var listener = util.createArrayListener(function (output) {
      t.equal(output.length, 2, 'should have two lines of output')
      t.equal(output[0], 'NICK CleanZenBot\r\n', 'should set nick as first line')
      t.equal(output[1], 'USER ZenIRCBot 8 * :ZenIRCBot V3\r\n', 'should set username and realname')
      t.end()
    })
    source.pipe(writer).pipe(listener)
  })

  t.test('raw', function (t) {
    var writer = new Writer()
    var source = util.createObjectSource([{
      command: 'raw',
      message: 'random raw command'
    }])
    var listener = util.createArrayListener(function (output) {
      t.equal(output.length, 1, 'should only output the command that was asked')
      t.equal(output[0], 'random raw command\r\n')
      t.end()
    })
    source.pipe(writer).pipe(listener)
  })
})