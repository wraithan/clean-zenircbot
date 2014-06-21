var stream = require('stream')
var util = require('util')
var log = require('./logger')('parser.js')
//function noop() {}
//var log = {trace: noop, debug: noop}

var IGNORED_COMMANDS = [
  '004',  // Possible modes
  '251',  // User count
  '252',  // IRC Op count
  '253',  // Unknown connection count
  '254',  // Channel count
  '255',  // Server connection count
  '265',  // Server users count
  '266',  // Global users count
  '250',  // Most connections
  '375',  // Start of MOTD
  '372',  // MOTD content
  '376',  // End of MOTD
  'MODE', // User or channel mode
]

// Regexes
var commandRegex = /^([^ ]*) *(.*)$/
var prefixRegex = /^:([^ ]*) *(.*)$/

var Parser = module.exports = function Parser() {

  stream.Transform.call(this, {objectMode: true})

  this._transform = function (chunk, encoding, done) {
    var data = chunk.toString()
    log.trace('Parser translated to: ', data)
    if (this._leftOvers) {
      data = this._leftOvers + data
    }

    var lines = data.split('\n').map(function (line) {return line.trim()})
    this._leftOvers = lines.splice(lines.length-1, 1)[0]
    lines.forEach(this.parse, this)
    done()
  }

  this._flush = function (done) {
    done()
  }
}

util.inherits(Parser, stream.Transform)

Parser.prototype.parse = function parse(line) {
  var data = {
    raw: line
  }

  var prefix = prefixRegex.exec(line)
  if (prefix) {
    data.prefix = prefix[1]
    var splitPrefix = this.parsePrefix(data.prefix)
    if (splitPrefix) {
      data.splitPrefix = splitPrefix
    }
  }

  var command = commandRegex.exec(line)
  if (command) {
    data.command = command[1]
    data.args = this.parseArgs(command[2])
    this.dispatch(data)
  } else {
    log.warn('No command:', {line: line, unhandled: true})
  }
}

Parser.prototype.parsePrefix = function parsePrefix(prefix) {
  var splitPrefix = prefix.split(/[!@]/)
  switch (splitPrefix.length) {
    case 1:
      return undefined
      break
    case 3:
      return {
        nick: splitPrefix[0],
        user: splitPrefix[1],
        host: splitPrefix[2]
      }
      break
    case 2:
      if (prefix.indexOf('!') !== -1) {
        return {
          nick: splitPrefix[0],
          user: splitPrefix[1],
          host: undefined
        }
      } else if (prefix.indexOf('@') !== -1) {
        return {
          nick: splitPrefix[0],
          user: undefined,
          host: splitPrefix[1]
        }
      }
      break
    default:
      log.warn('hit default splitPrefix case: ', splitPrefix)
      return {}
      break
  }
}

Parser.prototype.parseArgs = function parseArgs(args) {
  if (args.indexOf(':') === -1) {
    return args.split(' ')
  }
  var parsed = []
  var found = false
  var trailing = []
  var split = args.split(' ')
  for (var i = 0; i < split.length; i++) {
    if (found) {
      trailing.push(split[i])
    } else if (split[i][0] !== ':') {
      parsed.push(split[i])
    } else {
      found = true
      trailing.push(split[i].slice(1))
    }
  }
  if (found) {
    parsed.push(trailing.join(' '))
  }
  return parsed
}

Parser.prototype.dispatch = function dispatch(data) {
  if (data.command === '001') {
    log.debug({
      raw: data.raw,
      prefix: data.prefix,
      command: data.command,
      args: data.args,
    })
    this.push({command: 'connected', data: data})
  } else if (data.command === 'JOIN') {
    log.debug({
      raw: data.raw,
      prefix: data.prefix,
      command: data.command,
      args: data.args,
    })
    this.push({command: 'join', data: data})
  } else if (data.command === 'PING') {
    log.debug({
      raw: data.raw,
      prefix: data.prefix,
      command: data.command,
      args: data.args,
    })
    data.from = data.args[0]
    this.push({
      command: 'ping',
      data: data
    })
  } else if (data.command === '332') {
    log.debug({
      raw: data.raw,
      prefix: data.prefix,
      command: data.command,
      args: data.args,
    })
    data.channel = data.args[1]
    data.topic = data.args[2]
    this.push({
      command: 'topic',
      data: data
    })
  } else if (IGNORED_COMMANDS.indexOf(data.command) !== -1) {
    log.debug({
      raw: data.raw,
      prefix: data.prefix,
      command: data.command,
      args: data.args,
      ignored: true
    })
  } else {
    log.debug({
      raw: data.raw,
      prefix: data.prefix,
      command: data.command,
      args: data.args,
      unhandled: true
    })
  }

}




