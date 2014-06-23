require('../lib/logger').init({level: 'fatal'})
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
    var joinString = ':CleanZenBot!~ZenIRCBot@c-76-115-44-205.hsd1.or.comcast.net JOIN #thebotterybarn'
    var source = createSource([joinString])
    var listener = createListener(function (obj, encoding, done) {
      t.equal(obj.command, 'join', 'translate command')
      t.deepEqual(obj.data, {
        raw: joinString,
        prefix: 'CleanZenBot!~ZenIRCBot@c-76-115-44-205.hsd1.or.comcast.net',
        command: 'JOIN',
        args: ['#thebotterybarn'],
        splitPrefix: {
          nick: 'CleanZenBot',
          user: '~ZenIRCBot',
          host: 'c-76-115-44-205.hsd1.or.comcast.net'
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
})
 
function createSource (data) {
  var source = stream.Readable()
  source.data = data
  source.index = 0
  source._read = function () {
    if(source.index < source.data.length) {
      var string = source.data[source.index] + '\r\n'
      source.push(string)
      source.index += 1
    }
  }
  return source
}

function createListener (write) {
  var listener = stream.Writable({objectMode: true})
  listener._write = write
  return listener
}
