var test = require('tape').test
var Parser = require('../lib/parser')
var util = require('./util')

test('Parser tests', function (t) {

  t.test('connected', function (t) {
    var parser = new Parser()
    var connectString = ':kornbluth.freenode.net 001 CleanZenBot :Welcome to the freenode Internet Relay Chat Network CleanZenBot'
    var source = util.createStringSource([
      connectString
    ])
    var listener = util.createListener(function (obj, encoding, done) {
      t.equal(obj.command, 'connected', 'translate command')
      t.deepEqual(obj.data, {
        raw: connectString,
        prefix: 'kornbluth.freenode.net',
        command: '001',
        args: ['CleanZenBot', 'Welcome to the freenode Internet Relay Chat Network CleanZenBot']
      }, 'parse out the data')
      done()
      t.end()
    })
    source.pipe(parser).pipe(listener)
  })

  t.test('join', function (t) {
    var parser = new Parser()
    var joinString = ':CleanZenBot!~ZenIRCBot@c-00-000-00-000.hsd1.or.comcast.net JOIN #thebotterybarn'
    var source = util.createStringSource([joinString])
    var listener = util.createListener(function (obj, encoding, done) {
      t.equal(obj.command, 'join', 'translate command')
      t.deepEqual(obj.data, {
        raw: joinString,
        prefix: 'CleanZenBot!~ZenIRCBot@c-00-000-00-000.hsd1.or.comcast.net',
        command: 'JOIN',
        args: ['#thebotterybarn'],
        splitPrefix: {
          nick: 'CleanZenBot',
          user: '~ZenIRCBot',
          host: 'c-00-000-00-000.hsd1.or.comcast.net'
        }
      }, 'parse out the data')
      setTimeout(function () {
        t.end()
        done()
      }, 1000)
    })
    source.pipe(parser).pipe(listener)
  })

  t.test('topic', function (t) {
    var parser = new Parser()
    var topicString = ':wilhelm.freenode.net 332 CleanZenBot #pdxbots :Portland IRC (and other) Bot channel, feel free to botspam | http://docs.zenircbot.net/'
    var source = util.createStringSource([topicString])
    var listener = util.createListener(function (obj, encoding, done) {
      t.equal(obj.command, 'topic', 'translate command')
      t.deepEqual(obj.data, {
        raw: topicString,
        prefix: 'wilhelm.freenode.net',
        command: '332',
        args: [
          'CleanZenBot',
          '#pdxbots',
          'Portland IRC (and other) Bot channel, feel free to botspam | http://docs.zenircbot.net/'
        ],
        channel: '#pdxbots',
        topic: 'Portland IRC (and other) Bot channel, feel free to botspam | http://docs.zenircbot.net/'
      }, 'parse out the data')
      t.end()
      done()
    })
    source.pipe(parser).pipe(listener)
  })

  t.test('privmsg', function (t) {
    var parser = new Parser()
    var privmsgString = ':CleanZenBot!~ZenIRCBot@c-00-000-00-000.hsd1.or.comcast.net PRIVMSG #pdxbots :ZenIRCBot :the most rad bot.'
    var source = util.createStringSource([privmsgString])
    var listener = util.createListener(function (obj, encoding, done) {
      t.equal(obj.command, 'privmsg', 'translated command')
      var expectedData = {
        raw: privmsgString,
        prefix: 'CleanZenBot!~ZenIRCBot@c-00-000-00-000.hsd1.or.comcast.net',
        command: 'PRIVMSG',
        nick: 'CleanZenBot',
        message: 'ZenIRCBot :the most rad bot.',
        to: '#pdxbots',
        args: ['#pdxbots', 'ZenIRCBot :the most rad bot.'],
        splitPrefix: {
          nick: 'CleanZenBot',
          user: '~ZenIRCBot',
          host: 'c-00-000-00-000.hsd1.or.comcast.net'
        }
      }
      t.deepEqual(obj.data, expectedData, 'parse out the data')
      t.end()
      done()
    })
    source.pipe(parser).pipe(listener)
  })

  t.test('ctcp action', function (t) {
    var parser = new Parser()
    var ctcpString = ':CleanZenBot!~ZenIRCBot@c-00-000-00-000.hsd1.or.comcast.net PRIVMSG #pdxbots :\u0001ACTION did some stuff\u0001'
    var source = util.createStringSource([ctcpString])
    var listener = util.createListener(function (obj, encoding, done) {
      t.equal(obj.command, 'ctcp', 'translated command')
      var expectedData = {
        raw: ctcpString,
        prefix: 'CleanZenBot!~ZenIRCBot@c-00-000-00-000.hsd1.or.comcast.net',
        command: 'PRIVMSG',
        type: 'action',
        nick: 'CleanZenBot',
        message: 'did some stuff',
        to: '#pdxbots',
        args: ['#pdxbots', '\u0001ACTION did some stuff\u0001'],
        splitPrefix: {
          nick: 'CleanZenBot',
          user: '~ZenIRCBot',
          host: 'c-00-000-00-000.hsd1.or.comcast.net'
        }
      }
      t.deepEqual(obj.data, expectedData, 'parse out the data')
      t.end()
      done()
    })
    source.pipe(parser).pipe(listener)
  })

  t.test('nick', function (t) {
    var parser = new Parser()
    var nickString = ':CleanZenBot1!~ZenIRCBot@c-00-000-00-000.hsd1.or.comcast.net NICK :CleanZenBot'
    var source = util.createStringSource([nickString])
    var listener = util.createListener(function (obj, encoding, done) {
      t.equal(obj.command, 'nick', 'translated command')
      var expectedData = {
        raw: nickString,
        prefix: 'CleanZenBot1!~ZenIRCBot@c-00-000-00-000.hsd1.or.comcast.net',
        command: 'NICK',
        oldNick: 'CleanZenBot1',
        newNick: 'CleanZenBot',
        args: ['CleanZenBot'],
        splitPrefix: {
          nick: 'CleanZenBot1',
          user: '~ZenIRCBot',
          host: 'c-00-000-00-000.hsd1.or.comcast.net'
        }
      }
      t.deepEqual(obj.data, expectedData, 'parse out the data')
      t.end()
      done()
    })
    source.pipe(parser).pipe(listener)
  })

  t.test('part single', function (t) {
    var parser = new Parser()
    var partString = ':CleanZenBot!~ZenIRCBot@c-00-000-00-000.hsd1.or.comcast.net PART #pdxbots :Leaving...'
    var source = util.createStringSource([partString])
    var listener = util.createListener(function (obj, encoding, done) {
      t.equal(obj.command, 'part', 'translated command')
      var expectedData = {
        raw: partString,
        prefix: 'CleanZenBot!~ZenIRCBot@c-00-000-00-000.hsd1.or.comcast.net',
        command: 'PART',
        channels: ['#pdxbots'],
        message: 'Leaving...',
        args: ['#pdxbots', 'Leaving...'],
        splitPrefix: {
          nick: 'CleanZenBot',
          user: '~ZenIRCBot',
          host: 'c-00-000-00-000.hsd1.or.comcast.net'
        }
      }
      t.deepEqual(obj.data, expectedData, 'parse out the data')
      t.end()
      done()
    })
    source.pipe(parser).pipe(listener)
  })

  t.test('part mutli', function (t) {
    var parser = new Parser()
    var partString = ':CleanZenBot!~ZenIRCBot@c-00-000-00-000.hsd1.or.comcast.net PART #pdxbots,#pdxtech :Leaving...'
    var source = util.createStringSource([partString])
    var listener = util.createListener(function (obj, encoding, done) {
      t.equal(obj.command, 'part', 'translated command')
      var expectedData = {
        raw: partString,
        prefix: 'CleanZenBot!~ZenIRCBot@c-00-000-00-000.hsd1.or.comcast.net',
        command: 'PART',
        channels: ['#pdxbots', '#pdxtech'],
        message: 'Leaving...',
        args: ['#pdxbots,#pdxtech', 'Leaving...'],
        splitPrefix: {
          nick: 'CleanZenBot',
          user: '~ZenIRCBot',
          host: 'c-00-000-00-000.hsd1.or.comcast.net'
        }
      }
      t.deepEqual(obj.data, expectedData, 'parse out the data')
      t.end()
      done()
    })
    source.pipe(parser).pipe(listener)
  })

  t.test('quit', function (t) {
    var parser = new Parser()
    var quitString = ':CleanZenBot!~ZenIRCBot@c-00-000-00-000.hsd1.or.comcast.net QUIT :Leaving...'
    var source = util.createStringSource([quitString])
    var listener = util.createListener(function (obj, encoding, done) {
      t.equal(obj.command, 'quit', 'translated command')
      var expectedData = {
        raw: quitString,
        prefix: 'CleanZenBot!~ZenIRCBot@c-00-000-00-000.hsd1.or.comcast.net',
        command: 'QUIT',
        message: 'Leaving...',
        args: ['Leaving...'],
        splitPrefix: {
          nick: 'CleanZenBot',
          user: '~ZenIRCBot',
          host: 'c-00-000-00-000.hsd1.or.comcast.net'
        }
      }
      t.deepEqual(obj.data, expectedData, 'parse out the data')
      t.end()
      done()
    })
    source.pipe(parser).pipe(listener)
  })

  t.test('names', function (t) {
    var parser = new Parser()
    var firstString = ':rajaniemi.freenode.net 353 CleanZenBot = #pdxbots :@Edyth Lilly Alaina Eneida'
    var secondString = ':rajaniemi.freenode.net 353 CleanZenBot = #pdxbots :Neely Nilda +Yuk Tisha Adam'
    var endString = ':rajaniemi.freenode.net 366 CleanZenBot #pdxbots :End of /NAMES list.'
    var source = util.createStringSource([firstString, secondString, endString])
    var listener = util.createListener(function (obj, encoding, done) {
      t.equal(obj.command, 'names', 'translate command')
      var expectedData = {
        raw: [firstString, secondString, endString],
        prefix: 'rajaniemi.freenode.net',
        command: ['353', '353', '366'],
        args: [
          ['CleanZenBot', '=', '#pdxbots', '@Edyth Lilly Alaina Eneida'],
          ['CleanZenBot', '=', '#pdxbots', 'Neely Nilda +Yuk Tisha Adam'],
          ['CleanZenBot', '#pdxbots', 'End of /NAMES list.']
        ],
        channel: '#pdxbots',
        allNames: [
          'Edyth',
          'Lilly',
          'Alaina',
          'Eneida',
          'Neely',
          'Nilda',
          'Yuk',
          'Tisha',
          'Adam'
        ],
        names: {
          normal: [
            'Lilly',
            'Alaina',
            'Eneida',
            'Neely',
            'Nilda',
            'Tisha',
            'Adam'
          ],
          '@': [
            'Edyth'
          ],
          '+': [
            'Yuk'
          ]
        }
      }
      t.deepEqual(obj.data, expectedData, 'parse out the data')
      var keys = Object.keys(expectedData)
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        t.deepEqual(obj.data[key], expectedData[key], 'each value is correct')
      }
      t.end()
      done()
    })
    source.pipe(parser).pipe(listener)
  })

  t.test('ping', function (t) {
    var parser = new Parser()
    var pingString = 'PING :holmes.freenode.net'
    var source = util.createStringSource([pingString])
    var listener = util.createListener(function (obj, encoding, done) {
      t.equal(obj.command, 'ping', 'translate command')
      t.deepEqual(obj.data, {
        raw: pingString,
        command: 'PING',
        args: [
          'holmes.freenode.net'
        ],
        from: 'holmes.freenode.net'
      }, 'parse out the data')
      t.end()
      done()
    })
    source.pipe(parser).pipe(listener)
  })
})
