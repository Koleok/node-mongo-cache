MongoCache = require '../lib'

cache = new MongoCache {
  collection: 'cache'
  db: 'test'
  host: 'localhost'
  pass: ''
  port: 27017
  user: 'admin'
}

cache.set 'hello', 'world', 10, (err, value) ->
  console.log 'set', err, value
  cache.get 'hello', (err, value) ->
    console.log 'get', err, value
    process.exit 0
