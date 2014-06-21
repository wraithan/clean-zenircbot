# Clean ZenIRCBot

Problem: ZenIRCBot needs a full refactor for the following reasons.

* Terrible tests. The only tests that exist are integration tests, no unit
  tests.
* IRC Lib. The current IRC lib is mostly unmaintained with a periodic blind
  pull-request merges. This has caused headache in the past.
* Configuration. Basically it sucks, a number of `.json.dist` files that you
  have to copy then edit.

Solution: Rewrite it from scratch using very few libraries.

## IRC Lib

The file `./lib/parser.js` is currently the whole IRC lib that I'm using. It is
primative and I plan on moving it out of the repo once it matures. Currently the
IRC lib doesn't handle any of the socket stuff. It just expects you to pipe a
socket into it.

The lib will probably continue to be purely stream based. Some other modules
will be developed on top to turn it into a emitter based, or filtered streams.
This allows the core IRC implementation to be simple while also providing a rich
and varied API.

### Tests

The IRC lib is the only tested portion currently. To extend the parser, you must
also add tests proving that the line(s) that it should be dealing with return
the right sort of object.

## Bot

The file `./lib/bot.js` is where the bot currently lives. I plan on leaving the
bot there. Instead of using `config.json.dist` like I do in current ZenIRCBot,
the bot will be a binary that gets installed. It will load config from
`~/.zenircbot/` or whatever directory is specified on the commandline.

The current implementation is a spike. Mostly a proof that the IRC lib works.
Anything that needs to be thrown own or changed to make it testable will be.

## Services

I am eschewing all default services. Even `admin.js` and `semantics.js`. They
will be broken out into their own repos that are separately installable.
Services going forward will be akin to the bot, a command that gets installed.
This will make the bot seem less language dependant and be, in general, more
flexible.
