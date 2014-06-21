var cliOptions = require('./lib/cli')(process.argv)
new (require('./lib/bot'))(cliOptions).connect()
