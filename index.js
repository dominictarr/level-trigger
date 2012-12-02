
var queuer  = require('level-queue')
var hooks   = require('level-hooks')
var uuid    = require('node-uuid')
var iterate = require('iterate')

function between(key, range) {
  return (
    (!range.start || range.start <= key) &&
    (!range.end || key <= job.end)
  )
}

module.exports = function (db) {

  if(db.trigger) return db

  var ranges = {}

  db.trigger = {
    add: function (range, job) {

      if(!job) job = range.job
      else     range.job = job

      range.name = range.name || uuid()
      ranges[range.name] = range
      db.queue.add('queue:'+range.name, job)
    }
  }

  queue()(db)
  hooks()(db)

  hooks.pre(function (batch) {
    var insert = []

    //for each operation inside each range,
    //atomically add a record, or run a the job.
    iterate.join(batch, ranges, function (item, range, _, name) {
      var key = ''+item.key
      if(between(key, range))
        insert.push(db.queue(job.name, key, false))
    })
    return batch.concat(insert)
  })
}
