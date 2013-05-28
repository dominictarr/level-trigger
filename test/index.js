var levelup = require('level-test')()
var sublevel = require('level-sublevel')

var mac     = require('macgyver')().autoValidate()
var Trigger = require('..')

var db = sublevel(levelup('level-trigger-test'))

var reduceDb = db.sublevel('reduce')
var reduced = 0

var trigDb = Trigger(db, 'test-trigger', function (item) {
    //map
    console.log('MAP', JSON.stringify({
      key: ''+item.key,
      type: item.type
    }))
    var obj = item.value ? JSON.parse(item.value) : null
    return JSON.stringify({
      key: ''+item.key, 
      type: item.type
    })
  },
  function (value, done) {
    value = JSON.parse(value)
    
    function reduce (acc, n, put) {
      return (acc || 0) + (put ? 1 : -1)
    }

    var put = value.type == 'put'

    console.log('reduced', reduced, value)
    reduced = reduce(reduced, value, put)
    reduceDb.put('reduced', JSON.stringify(reduced), done)
    db.emit('test:reduce', reduced)
  })

//if we don't wait for the queue to drain,
//then it will read puts from these twice.
//TODO: add snapshot option for leveldb.

db.put('hello-A', JSON.stringify({thing: 1}))
db.put('hello-B', JSON.stringify({thing: 2}))
db.put('hello-C', JSON.stringify({thing: 3}))
db.put('hello-D', JSON.stringify({thing: 6}))
db.del('hello-C')

db.on('test:reduce', mac().times(5))


