const curry = require('curry')
const mongodb = require('mongodb')
const typeIs = curry((type, val) => typeof val === type)
const isFunction = typeIs('function')

const defaults = {
  collection: 'cache',
  db: 'test',
  host: 'localhost',
  pass: '',
  port: 27017,
  user: 'admin',
  options: {
    db: {
      native_parser: false,
    },
    server: {
      auto_reconnect: true,
      poolSize: 1,
      socketOptions: {
        keepAlive: 120,
      },
    },
  },
}

module.exports = class MongoCache {
  constructor(cfg) {
    this.config = Object.assign({}, defaults, cfg)
    this.connect()
  }

  connect(next) {
    if (this.db) return isFunction(next) ? next() : undefined

    const {
      collection,
      db,
      host,
      options,
      pass,
      port,
      user,
    } = this.config

    const url = `mongodb://${user}:${pass}@${host}:${port}/${db}`
      .replace(':@', '@')

    return mongodb.MongoClient.connect(url, options, () => (err, database) => {
      if (err) return isFunction(next) ? next(err) : undefined

      this.db = database
      this.collection = this.db.collection(collection)
      return isFunction(next) ? next(err, database) : undefined
   })
  }

  delete(key, next) {
    return this.connect(() => err => {
      if (err) return next(err)

      return this.collection.remove(
        { key: key },
        { safe: true },
        (err, num_removed) => next(err, null)
      )
    })
  }

  get(key, next) {
    return this.connect(() => err => {
      if (err) return next(err)

      return this.collection.findOne({ key: key }, (err, item) => {
        if (err) return next(err)

        if ((item !== null ? item.expires : undefined) < Date.now()) {
          return this.delete(key, next)
        }

        return next(null, item != null ? item.value : undefined)
      })
    })
  }

  set(key, value, ttl, next) {
    return this.connect(() => err => {
      if (err) return next(err)

      const query = { key: key }
      const item = { key: key, value: value, expires: Date.now() + 1000 * ttl }
      const options = { upsert: true, safe: true }

      return this.collection.update(
        query,
        item,
        options,
        err => next(err, item.value)
      )
    })
  }
}
