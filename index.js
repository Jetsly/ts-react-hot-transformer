if (process.env.NODE_ENV === 'production') {
  module.exports = require('./lib/react-hot.prod').default;
} else {
  module.exports = require('./lib/react-hot.dev').default;
}
