const curry = require('curry')
const mongodb = require('mongojs')
const promisify = require('es6-promisify')

const typeIs = curry((type, val) => typeof val === type)
const isFunction = typeIs('function')
const exists = x => x !== null

const upsert = true
const safe = true
const queryOptions = { upsert, safe }

const defaultConfig = {
  collection: 'cache',
  db: 'test',
  host: 'localhost',
  pass: '',
  port: 27017,
  user: 'admin',
}

const defaultOptions =  {
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
}

const safeValue = item => exists(item) ? item.value : undefined
const getExpireTime = ttl => Date.now() + 1000 * ttl
const checkIfExpired = item =>  exists(item) ? item.expires : undefined < Date.now()
const getConfig = user => Object.assign({}, defaultConfig, user)
const getOptions = user => Object.assign({}, defaultOptions, user)

const buildUrl = ({ user, pass, host, port, db, }) =>
  `mongodb://${user}:${pass}@${host}:${port}/${db}`
    .replace(':@', '@')
    .replace('/@', '/')

const connect = (url, { collection }) => mongodb(url, [collection])
const getCache = (db, { collection }) => db.collection(collection)

module.exports = (userConfig, userOptions) => {
  const config = getConfig(userConfig)
  const options = getOptions(userOptions)

  const url = buildUrl(config)
  const db = connect(url, config)
  const cache = getCache(db, config)

  const findInCache = promisify(cache.findOne)
  const updateInCache = promisify(cache.update)
  const removeFromCache = promisify(cache.remove)

  const _delete = key =>
    removeFromCache({ key }, { safe })

  const _get = key =>
    findInCache({ key })
      .then(item => checkIfExpired(item) ? _delete(key) : safeValue(item))

  const _set = (key, value, ttl) => {
    const query = { key }
    const item = { key, value, expires: getExpireTime(ttl) }

    return updateInCache(query, item, queryOptions)
  }

  return {
    delete: _delete,
    get: _get,
    set: _set,
  }
}
