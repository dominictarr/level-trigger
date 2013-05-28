var levelup  = require('level-test')()
var sublevel = require('level-sublevel')
var tape     = require('tape')

var mac     = require('macgyver')().autoValidate()
var Trigger = require('..')

tape('filter', function (t) {

  function okay (err) {
    t.notOk(err)
  }

  var db = sublevel(levelup('level-trigger-test'))
  var aggDb = db.sublevel('agg')
  var trigDb = Trigger(db, 'even-triggers', mac(function (item) {
    if(!(item.value % 2))
      return item.value
  }).twice(), mac(function (value, done) {
    t.equal(+value, 2)
    aggDb.put(value, value, function (err) {
      t.notOk(err)
      t.end()
    })
  }).once())

  db.put('foo', '1', okay)
  db.put('bar', '2', okay)
 
})
