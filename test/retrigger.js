var level = require('level-test')()
var tape = require('tape')
var sublevel = require('level-sublevel')
var Trigger = require('../')

tape('retrigger', function (t) {

  var db = sublevel(level('retrigger'))
  var totalDb = db.sublevel('total')

  Trigger(db, 'retrigger', function () {
      return 'foo' //one trigger for whole db!
    }, 
    function (_, done) {
      console.log('find total...')
      setTimeout(function () {
        var total = 0
        db.createReadStream()
          .on('data', function (data) {
             
            total += +data.value
          })
          .on('end', function () {
            console.log('total', total)
            totalDb.put('total', total, function (err) {
              console.log('total=', total)
              db.emit('total', total)
              done(err)
            })
          })
      }, 100)
    })

  db.put('foo', 4, function () {
    db.put('bar', 3, function () {
      db.put('zux', 2, function () {
        db.createReadStream().on('data', console.log)
      })
    })
  })

  db.on('total', function (val) {
    console.log('total', val)
    if(val == 9)
      t.end()
  })

})
