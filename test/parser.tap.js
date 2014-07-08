var test = require('tap').test
var Parser = require('../lib/parser')
var stream = require('stream')

test('Parser tests', {timeout: 10}, function (t) {

  t.test('connected', {timeout: 10}, function (t) {
    var parser = new Parser()
    var connectString = ':kornbluth.freenode.net 001 CleanZenBot :Welcome to the freenode Internet Relay Chat Network CleanZenBot'
    var source = createSource([
      connectString
    ])
    var listener = createListener(function (obj, encoding, done) {
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

  t.test('join', {timeout: 10}, function (t) {
    var parser = new Parser()
    var joinString = ':CleanZenBot!~ZenIRCBot@c-00-000-00-000.hsd1.or.comcast.net JOIN #thebotterybarn'
    var source = createSource([joinString])
    var listener = createListener(function (obj, encoding, done) {
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
      t.end()
      done()
    })
    source.pipe(parser).pipe(listener)
  })

  t.test('topic', {timeout: 10}, function (t) {
    var parser = new Parser()
    var topicString = ':wilhelm.freenode.net 332 CleanZenBot #pdxbots :Portland IRC (and other) Bot channel, feel free to botspam | http://docs.zenircbot.net/'
    var source = createSource([topicString])
    var listener = createListener(function (obj, encoding, done) {
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

  t.test('privmsg', {timeout: 10}, function (t) {
    // NotImplemented
  })

  t.test('ctcp', {timeout: 10}, function (t) {
    // NotImplemented
  })

  t.test('nick', {timeout: 10}, function (t) {
    // NotImplemented
  })

  t.test('part', {timeout: 10}, function (t) {
    // NotImplemented
  })

  t.test('quit', {timeout: 10}, function (t) {
    var parser = new Parser()
    var quitString = ':CleanZenBot!~ZenIRCBot@c-00-000-00-000.hsd1.or.comcast.net QUIT :Leaving...'
    var source = createSource([quitString])
    var listener = createListener(function (obj, encoding, done) {
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

  t.test('names', {timeout: 10}, function (t) {
    var parser = new Parser()
    var firstString = ':rajaniemi.freenode.net 353 CleanZenBot = #pdxbots :@Edyth Lilly Alaina Eneida'
    var secondString = ':rajaniemi.freenode.net 353 CleanZenBot = #pdxbots :Neely Nilda +Yuk Tisha Adam'
    var endString = ':rajaniemi.freenode.net 366 CleanZenBot #pdxbots :End of /NAMES list.'
    var source = createSource([firstString, secondString, endString])
    var listener = createListener(function (obj, encoding, done) {
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

  t.test('ping', {timeout: 10}, function (t) {
    var parser = new Parser()
    var pingString = 'PING :holmes.freenode.net'
    var source = createSource([pingString])
    var listener = createListener(function (obj, encoding, done) {
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

function createSource (data) {
  var source = stream.Readable()
  var sent = false
  source._read = function () {
    if(!sent) {
      source.push(data.join('\r\n') + '\r\n')
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
