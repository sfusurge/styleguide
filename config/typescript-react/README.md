# @sfusurge/typescript-react-config

<img src="../../.github/assets/surge.svg" alt="SFU Surge Logo" />

A preset configuration for React components with the [TypeScript](https://www.typescriptlang.org/) compiler.

[![TypeScript](https://github.com/sfusurge/styleguide/actions/workflows/typescript-react.yml/badge.svg?branch=main)](https://github.com/sfusurge/styleguide/actions/workflows/typescript-react.yml)

## Installation

After installing `@sfusurge/typescript-config` as a developer dependency, create `tsconfig.json` with the following contents:

```json
{
  "extends": "@sfusurge/typescript-react-config"
}
```

For unit testing, add a `test` script to run `surge-test` in `package.json`:

```json
{
  ...
  "scripts": {
    "test": "surge-test"
  }
  ...
}
```
