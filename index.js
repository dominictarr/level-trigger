
var queue   = require('level-queue')
var hooks   = require('level-hooks')
var uuid    = require('node-uuid')
var iterate = require('iterate')

function between(key, range) {
  return (
    (!range.start || range.start <= key) &&
    (!range.end || key <= range.end)
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
      range.start = ''
      range.end = '~'
      ranges[range.name] = range
      range.map = range.map || function (e) { return e.key }
      db.queue.add('trigger:'+range.name, job)
    }
  }

  queue()(db)
  hooks()(db)

  db.hooks.pre(function (batch) {
    var insert = []
    //for each operation inside each range,
    //atomically add a record, or run a the job.
    iterate.join(batch, ranges, function (item, range, _, name) {
      var key = ''+item.key, mapped
      if(between(key, range) && (mapped = range.map(item))) {

        insert.push(db.queue('trigger:' + range.name, mapped, false))
      }
    })

    return batch.concat(insert)
  })
}
