var dir = 'level-trigger-test'
var level = require('level-test')()
var sublevel = require('level-sublevel')

var Trigger = require('../')
var test    = require('tape')

test('start a trigger manually', function (t) {

  var db = sublevel(level(dir))
  var sum = 0, _sum = 0

  db.batch('abcdef'.split('').map(function (e) {
    var v = Math.round(100 * Math.random())
    sum += v
    return {key: e, value: v.toString(), type: 'put'}
  }), function () {
    //this trigger doesn't do any IO, so it can just be a prehook,
    //I'm using it in this test, though, because I just want to check trigDb.start() works
    var seq = Trigger(db, 'seq', function (key, done) {
      db.get(key, function (err, val) {
        if(err) return done(err)
        _sum += Number(val)
        t.ok(_sum <= sum, 'lte to correct total')
        if(_sum === sum) {
          t.ok(_sum == sum, 'correct total')
          return t.end()
        }
      })
    }).start()
  })

})
