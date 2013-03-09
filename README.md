# level-trigger

Triggers for levelup.

<img src=https://secure.travis-ci.org/dominictarr/level-trigger.png?branch=master>

Jobs must be idempotent!
If the process crashes before job has calledback,
it will be rerun the next time it's started, for consistency!

## Stability

Unstable: Expect patches and features, possible api changes.

# Example

``` js
var db       = require('levelup')('/tmp/level-trigger-example')
var SubLevel = require('level-sublevel'); SubLevel(db) //MUST install sublevel.
var Trigger  = require('level-trigger')

var trigDb = Trigger(db, 'example', function (ch) {
    //optionally index the job with a different key.
    //if there are two jobs with the same key,
    //it will only be triggered once.
    return ch.key
  },
  function (value, done) { 
    //call done when job is done.
    done()
  }
})

//if you want, start the trigger in batch mode.
//this will process all the keys in the input db.

//otherwise, jobs will be processed whenever a key is inserted!

if(require('optimist').argv.batch)
  trigDb.start()

```

## License

MIT



