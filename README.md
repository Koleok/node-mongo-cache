## Simple MongoDB cache for node.js

## Install
```bash
npm install node-mongo-cache
```

## Examples
```javascript
const MongoCache = require('../lib')

const cache = new MongoCache({
  collection: 'cache',
  db: 'test',
  host: 'localhost',
  pass: '',
  port: 27017,
  user: 'admin'
});

cache.set('hello', 'world', 10, (err, value) => {
  console.log('set', err, value);

  return cache.get('hello', (err, value) => {
    console.log('get', err, value);
    return process.exit(0);
  });
});
```
