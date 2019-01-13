<p align="center">
  <a href="https://www.npmjs.org/package/ts-react-hot-transformer"><img src="https://img.shields.io/npm/v/ts-react-hot-transformer.svg?style=flat" alt="npm"></a>
  <a href="https://www.npmjs.com/package/ts-react-hot-transformer"><img src="https://img.shields.io/npm/dt/ts-react-hot-transformer.svg" alt="downloads" ></a>
  <a href="https://travis-ci.org/Jetsly/ts-react-hot-transformer"><img src="https://travis-ci.org/Jetsly/ts-react-hot-transformer.svg?branch=master" alt="travis"></a>
</p>

# ts-react-hot-transformer

> react hot transformer for ts,and no babel

- **Standalone** : no babel, only configuration `ts-loader`


## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Code Splitting](#code-splitting)
- [License](#license)


## Installation

For use with [node](http://nodejs.org) and [npm](https://npmjs.com):

```sh
npm install --save-dev ts-react-hot-transformer
```

## Usage
### With ts-loader

1.  Add `ts-react-hot-transformer` to your `ts-loader` options:

```js
// webpack.config.js
const tsReactHotTransformer = require('ts-react-hot-transformer')

module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.(jsx|tsx|js|ts)$/,
        loader: 'ts-loader',
        options: {
          getCustomTransformers: () => ({
            before: [ tsReactHotTransformer() ]
          }),
        },
        exclude: /node_modules/
      }
    ]
  },
  // ...
}
```

2.  Mark your root component as _hot-exported_:

```js
// App.js
import { hot } from 'react-hot-loader/root'
const App = () => <div>Hello World!</div>
export default hot(App)
```


3.  [Run webpack with Hot Module Replacement](https://webpack.js.org/guides/hot-module-replacement/#enabling-hmr):

```sh
webpack-dev-server --hot
```


## Code Splitting
It is the same React-Dom, with the same version, to hot patch.

There is 2 ways to install it:

* Use `@hot-loader/react-dom` installed instead of `react-dom`

```
yarn add @hot-loader/react-dom
```

* Use webpack **aliases**

```js
// webpack.conf
...
resolve: {
    alias: {
      'react-dom': '@hot-loader/react-dom'
    }
}
...
```


## License

[MIT License](LICENSE.md)