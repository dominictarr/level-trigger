# level-trigger

Triggers for levelup.

<img src=https://secure.travis-ci.org/dominictarr/level-trigger.png?branch=master>

Jobs must be idempotent!
If the process crashes before job has calledback,
it will be rerun the next time it's started, for consistency!

# Example

``` js
var trigger = require('level-trigger')
trigger(db)

db.trigger.add({
  name: 'example',
  start: 'A', end: '~',
  mapKey: function (key) {
    //optionally index the job with a different key.
    //if there are two jobs with the same key,
    //it will only be triggered once.
    return key
  },
  job: function (value, done) { 
    //call done when job is done.
    done()
  }
})

```

## License

MIT



