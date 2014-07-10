var net = require('net')
var stream = require('stream')
var util = require('util')
var Parser = require('./parser')
var log = require('./logger')('bot.js')

var ZenIRCBot = module.exports = function ZenIRCBot() {
  this.ircHandler = new IRCHandler(this)
}

ZenIRCBot.prototype.connect = function(options) {
  options = options || {}
  var self = this
  var host = options.host || 'chat.freenode.net'
  this.outbound = new IRCOut()
  this.socket = net.connect({
    host: host,
    port: options.port || '6667'
  }, function () {
    self.parser = new Parser({})
    self.outbound.pipe(self.socket)
                 .pipe(self.parser)
                 .pipe(self.ircHandler)
    self.outbound.write('NICK CleanZenBot')
    self.outbound.write('USER ZenIRCBot 8 * :ZenIRCBot V3')

    log.info('Connected to: ' + host)
  })
}

ZenIRCBot.prototype.handle_connected = function () {
  log.info('Successfully connected')
  var channels = [
    '#ubuntu', '##linux', '#debian', '#bitcoin', '#freenode', '#haskell',
    '#archlinux', '#Node.js', '#gentoo', '#git', '##javascript', '#puppet',
    '#vim', '#go-nuts', '#docker', '#bash', '#android', '#ruby', '#dogecoin',
    '#postgresql', '#openstack', '##math', '#clojure', '#jquery', '#css',
    '##networking', '#emacs', '#angularjs', '#ansible', '#nginx', '#znc',
    '#mysql', '#perl', '##electronics', '##php', '#defocus', '#bitcoin-otc',
    '#quassel', '##windows', '#qt', '#freebsd', '#chromium', '#weechat', '##c'
  ]

  for (var i = 0; i < channels.length; i++) {
    this.outbound.write('JOIN ' + channels[i])
  }
}

ZenIRCBot.prototype.handle_ping = function (data) {
  var reply = 'PONG'
  if (data.from) {
    reply += ' ' + data.from
  }
  this.outbound.write(reply)
}

function IRCHandler(bot) {
  stream.Writable.call(this, {objectMode: true})
  this._write = function (obj, encoding, done) {
    if (typeof bot['handle_' + obj.command] === 'function') {
      bot['handle_' + obj.command](obj)
    }
    done()
  }
}

util.inherits(IRCHandler, stream.Writable)

function IRCOut() {
  stream.Transform.call(this)
  this._transform = function (data, encoding, done) {
    data = data.toString()
    log.trace({outbound: true}, 'Outbound data', data)
    this.push(data + '\n')
    done()
  }
  this._flush = function(done) {
    log.warn({outbound: true}, 'flush called?')
    done()
  }
}

util.inherits(IRCOut, stream.Transform)
