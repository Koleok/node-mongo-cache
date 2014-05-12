MongoCache = require '../lib'

cache = new MongoCache {
  collection: 'cache'
  db: 'test'
  host: 'localhost'
  pass: ''
  port: 27017
  user: 'admin'
}

cache.set 'hello', 'world', 10, (err, item) ->
  console.log 'set', err, item
  cache.get 'hello', (err, item) ->
    console.log 'get', err, item
    process.exit 0
