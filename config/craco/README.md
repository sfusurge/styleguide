# @sfusurge/craco-config 

<img src="../../.github/assets/surge.svg" alt="SFU Surge Logo" />

A preset configuration for [craco](https://www.npmjs.com/package/@craco/craco).

[![Eslint](https://github.com/sfusurge/styleguide/actions/workflows/craco.yml/badge.svg?branch=main)](https://github.com/sfusurge/styleguide/actions/workflows/craco.yml)

## Installation

After installing `@sfusurge/craco-config` as a developer dependency, create `craco.config.js` with the following contents:

```js
const surge = require('@sfusurge/craco-config');

module.exports = surge({
    // Your custom config here.
    // It will be applied after the Surge config.
});
```

## Bundled Plugins

* [react-app-alias](https://www.npmjs.com/package/react-app-alias)
* [sass-resources-loader](https://www.npmjs.com/package/sass-resources-loader)
  To use `sass-resources-loader`, add a `sassResources` array to your `package.json` file:

  ```json
  {
    ...
    "sassResources": [
        "./src/mixins.scss"
    ]
    ...
  }
  ```
