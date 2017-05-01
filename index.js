'use strict';
var shasum = require('shasum')
var timestamp = require('monotonic-timestamp')
//if a job starts, and another is queued before the current job ends,
//delay it, so that the job is only triggered once.

module.exports = function (input, jobs, map, work) {
  if(!work) work = map, map = function (data) { return data.key }
  //create a subsection for the jobs,
  //if you don't pass in a separate db,
  //create a section inside the input
  var pending = {}, running = {}, runningCount = 0, pendingCount = 0


  if('string' === typeof jobs)
    jobs = input.sublevel(jobs, {encoding: 'utf8'})

  var working = false

  function checkIncomplete () {
    if(working) return
    if(0 === runningCount + pendingCount) return
    working = true
    jobs.emit('incomplete')
  }

  function checkComplete () {
    var _working = (0 !== (runningCount + pendingCount))
    if(_working === working) return

    working = _working
    jobs.emit(working ? 'incomplete' : 'complete')
  }

  jobs.isComplete = function () {
    return !working
  }

  function deleteJob(data, hash) {
    jobs.del(data.key, function (err) {
      if(err) return setTimeout(function () {
        deleteJob(data, hash)
        // atleast we are consistent with this?
      }, 50);

      runningCount --
      delete running[hash]

      if(pending[hash]) {
        pendingCount --
        delete pending[hash]
        doJob(data)
      }

      checkComplete()
    })
  }

  function doJob (data) {
    //don't process deletes!
    if(!data.value) return
    var hash = shasum(data.value)

    if(!running[hash]) {
      runningCount ++
      running[hash] = true
      checkComplete()
    }
    else return

    var done = false

    work(data.value, function (err) {
      if(done) return
      done = true
      if(err) {
        console.error(err.stack)
        return setTimeout(function () {
          delete running[hash]
          doJob(data)
        //hardcoded timeout WTF
        }, 50)
      }

      deleteJob(data, hash)

    })
  }

  function doHook (ch, add) {
    var key = map(ch)
    if(key == null || ! ch.value) return

    var hash = shasum(key)

    if(!running[hash])
      add({
        key: timestamp(), value: key,
        type: 'put', prefix: jobs,
        valueEncoding: 'utf8', keyEncoding: 'utf8'
      })
    else if(!pending[hash]) {
      pendingCount ++
      pending[hash] = true
      checkComplete()
    }
  }

  input.pre(doHook)

  //process the whole db as a batch
  jobs.start = function () {
    var hadData = false;
    input.createReadStream({valueEncoding: 'utf8'})
      .on('data', function (data) {
        hadData = true
        doHook(data, doJob)
      })
      .on('end', function () {
        if (! hadData && ! working) jobs.emit('complete')
      })
    return jobs
  }

  jobs.createReadStream({valueEncoding:'utf8'}).on('data', doJob)
  jobs.post(doJob)

  return jobs
}

