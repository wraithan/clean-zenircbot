module.exports = {
  test: createTest
}

var testStore = []

function createTest(name, opts, cb) {
  if (typeof name !== 'string') {
    throw new Error('name is required')
  }
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  if (typeof opts !== 'object') {
    opts = {}
  }
  if (typeof cb !== 'function') {
    throw new Error('test callback is required')
  }
  return new Test(name, opts, cb)

}

function Test(name, opts, cb) {
  this.name = name
  this.opts = opts
  this.callback = cb

}

Test.prototype.run = function run() {
  this.callback(this)
}
