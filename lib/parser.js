'use strict'

var stream = require('stream')
var util = require('util')

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

  // Storage area for names lists as they come in over a couple commands
  this._names = {}

  this._transform = function (chunk, encoding, done) {
    var data = chunk.toString()
    console.log(data)
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
    var splitPrefix = parsePrefix(data.prefix)
    if (splitPrefix) {
      data.splitPrefix = splitPrefix
    }
    line = prefix[2]
  }

  var command = commandRegex.exec(line)
  if (command) {
    data.command = command[1]
    data.args = parseArgs(command[2])
    this.dispatch(data)
  }
}

Parser.prototype.dispatch = function dispatch(data) {
  var channel, names, stored  // Because var is function local not block

  if (data.command === '001') {
    this.push({command: 'connected', data: data})

  } else if (data.command === 'PRIVMSG') {
    data.to = data.args[0]
    data.nick = data.splitPrefix.nick
    data.message = data.args[1]
    if (data.message[0] !== '\u0001') {
      this.push({command: 'privmsg', data: data})
    } else {
      var space = data.message.indexOf(' ')
      data.type = data.message.substr(1, space-1).toLowerCase()
      data.message = data.message.substr(space+1, data.message.length-space-2)
      this.push({command: 'ctcp', data: data})
    }

  } else if (data.command === 'NICK') {
    data.newNick = data.args[0]
    data.oldNick = data.splitPrefix.nick
    this.push({command: 'nick', data: data})

  } else if (data.command === 'JOIN') {
    this.push({command: 'join', data: data})

  } else if (data.command === 'PART') {
    data.channels = data.args[0].split(',')
    data.message = data.args[1]
    if (!data.message) {
      data.message = ''
    }
    this.push({command: 'part', data: data})

  } else if (data.command === 'QUIT') {
    data.message = data.args[0]
    if (!data.message) {
      data.message = ''
    }
    this.push({command: 'quit', data: data})

  } else if (data.command === 'PING') {
    data.from = data.args[0]
    this.push({command: 'ping', data: data})

  } else if (data.command === '332') {
    data.channel = data.args[1]
    data.topic = data.args[2]
    this.push({command: 'topic', data: data})

  } else if (data.command === '353') {
    channel = data.args[2]
    names = data.args[3].split(' ')
    stored = this._names[channel]
    if (!stored) {
      stored = this._names[channel] = {
        raw: [],
        commands: [],
        names: [],
        args: []
      }
    }
    if (stored && stored.names && stored.names.length) {
      stored.names = stored.names.concat(names)
    } else {
      stored.names = names
    }
    stored.args.push(data.args)
    stored.commands.push(data.command)
    stored.raw.push(data.raw)

  } else if (data.command === '366') {
    channel = data.args[1]
    stored = this._names[channel]
    if (stored) {
      data.channel = channel
      data.allNames = []
      data.names = {
        normal: [],
        '@': [],
        '+': []
      }
      var count = stored.names.length
      for (var i = 0; i < count; i++) {
        var name = stored.names[i]
        if (name[0] === '@') {
          name = name.substr(1)
          data.names['@'].push(name)
        } else if (name[0] === '+') {
          name = name.substr(1)
          data.names['+'].push(name)
        } else {
          data.names.normal.push(name)
        }
        data.allNames.push(name)
      }
      stored.args.push(data.args)
      stored.commands.push(data.command)
      stored.raw.push(data.raw)
      data.args = stored.args
      data.command = stored.commands
      data.raw = stored.raw
      this.push({command: 'names', data: data})
    }

  } else if (IGNORED_COMMANDS.indexOf(data.command) !== -1) {
    data.ignored = true

  } else {
    data.unhandled = true
  }
}

function parseArgs(args) {
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

function parsePrefix(prefix) {
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
      return {}
      break
  }
}