
# dependencies
merge = require 'deepmerge'
mongodb = require 'mongodb'


# exports
class exports.MongoCache
  constructor: (cfg) ->

    # default configuration
    @config = merge {
      collection: 'cache'
      db: 'test'
      host: 'localhost'
      pass: ''
      port: 27017
      user: 'admin'
      options:
        db:
          native_parser: false
        server:
          auto_reconnect: true
          poolSize: 1
          socketOptions:
            keepAlive: 120
    }, cfg

    @connect()

  connect: (next) ->
    return next?() if @db
    c = @config
    url = "mongodb://#{c.user}:#{c.pass}@#{c.host}:#{c.port}/#{c.db}"
    url = url.replace ':@', '@'
    mongodb.MongoClient.connect url, c.options, (err, database) =>
      return next?(err) if err
      @db = database
      @collection = @db.collection c.collection
      next?(err, database)

  delete: (key, next) ->
    @connect (err) =>
      return next err if err
      @collection.remove {key: key}, {safe: true}, (err, num_removed) ->
        next err, null

  get: (key, next) ->
    @connect (err) =>
      return next err if err
      @collection.findOne {key: key}, (err, item) =>
        return next err if err
        if item?.expires < Date.now()
          return @delete key, next
        next null, item?.value

  set: (key, value, ttl, next) ->
    @connect (err) =>
      return next err if err
      query = {key: key}
      item = {
        key: key
        value: value
        expires: Date.now() + 1000 * (ttl or 60)
      }
      options = {upsert: true, safe: true}
      @collection.update query, item, options, (err) ->
        next err, item.value

