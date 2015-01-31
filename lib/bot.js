'use strict'

var net = require('net')
var stream = require('stream')
var util = require('util')
var Parser = require('./parser')
var Writer = require('./writer')
var log = require('./logger')('bot.js')

var ZenIRCBot = module.exports = function ZenIRCBot() {
  if (!(this instanceof ZenIRCBot)) {
    return new ZenIRCBot()
  }

  this.ircHandler = new IRCHandler(this)
}

ZenIRCBot.prototype.connect = function(options) {
  options = options || {}
  var bot = this
  var host = options.host || 'chat.freenode.net'
  this._outbound = new IRCOut()
  var socket = net.connect({
    host: host,
    port: options.port || '6667'
  })

  socket.on('connect', function () {
    var parser = new Parser({})
    var writer = new Writer({})
    bot._outbound.pipe(writer)
                 .pipe(socket)
                 .pipe(parser)
                 .pipe(bot.ircHandler)

    bot.write({
      command: 'connect',
      nick: 'CleanZenBot',
      username: 'ZenIRCBot',
      realname: 'ZenIRCBot V3'
    })
    log.info('Connected to: ' + host)
  })
}

ZenIRCBot.prototype.write = function write (obj) {
  this._outbound.write(obj)
}

ZenIRCBot.prototype.handle_connected = function () {
  log.info('Successfully connected')
  // var channels = [
  //   '#ubuntu', '##linux', '#debian', '#bitcoin', '#freenode', '#haskell',
  //   '#archlinux', '#Node.js', '#gentoo', '#git', '##javascript', '#puppet',
  //   '#vim', '#go-nuts', '#docker', '#bash', '#android', '#ruby', '#dogecoin',
  //   '#postgresql', '#openstack', '##math', '#clojure', '#jquery', '#css',
  //   '##networking', '#emacs', '#angularjs', '#ansible', '#nginx', '#znc',
  //   '#mysql', '#perl', '##electronics', '##php', '#defocus', '#bitcoin-otc',
  //   '#quassel', '##windows', '#qt', '#freebsd', '#chromium', '#weechat', '##c'
  // ]
  var channels = [
    '#wraithan', '#pdxbots'
  ]

  for (var i = 0; i < channels.length; i++) {
    this.write({
      command: 'raw',
      message: 'JOIN ' + channels[i]
    })
  }
}

ZenIRCBot.prototype.handle_ping = function (data) {
  var reply = 'PONG'
  if (data.from) {
    reply += ' ' + data.from
  }
  this.write({
    command: 'raw',
    message: reply
  })
}

function IRCHandler(bot) {
  stream.Writable.call(this, {objectMode: true})
  this._write = function (obj, encoding, done) {
    log.info(obj, 'in IRCHandler')
    if (typeof bot['handle_' + obj.command] === 'function') {
      bot['handle_' + obj.command](obj)
    }
    done()
  }
}

util.inherits(IRCHandler, stream.Writable)

function IRCOut() {
  stream.Transform.call(this, {objectMode: true})
  this._transform = function (data, encoding, done) {
    log.trace({outbound: true, data: data}, 'Outbound data')
    this.push(data)
    done()
  }
  this._flush = function(done) {
    log.warn({outbound: true}, 'flush called?')
    done()
  }
}

util.inherits(IRCOut, stream.Transform)
