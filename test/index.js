
var levelup = require('levelup')
var rimraf  = require('rimraf')
var mac     = require('macgyver')().autoValidate()
var trigger = require('..')

var path = '/tmp/level-trigger-test'

rimraf(path, function () {
  levelup(path, {createIfMissing: true}, function (err, db) {

    trigger(db)
    
    var reduced = null

    db.trigger.add({

      name: 'test',

      map: function (item) {
        var obj = item.value ? JSON.parse(item.value) : null
        return JSON.stringify({
          key: ''+item.key, 
          type: item.type
        })
      },

      job: function (value, done) {
        value = JSON.parse(value)
        
        function reduce (acc, n, put) {
          return (acc || 0) + (put ? 1 : -1)
        }

        var put = value.type == 'put'

        reduced = reduce(reduced, value, put)
        console.log('thing', reduced)

        db.put('~trigger:reduced', JSON.stringify(reduced), done)

        db.emit('test:reduce', reduced)
      }

    })

    //if we don't wait for the queue to drain,
    //then it will read puts from these twice.
    //TODO: add snapshot option for leveldb.
    db.once('queue:drain', function () {
      db.put('hello-A', JSON.stringify({thing: 1}))
      db.put('hello-B', JSON.stringify({thing: 2}))
      db.put('hello-C', JSON.stringify({thing: 3}))
      db.put('hello-D', JSON.stringify({thing: 6}))
      db.del('hello-C')
    })

    db.on('test:reduce', mac().times(5))
  })
})
