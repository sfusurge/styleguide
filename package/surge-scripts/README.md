# @sfusurge/surge-scripts 

<img src="../../.github/assets/surge.svg" alt="SFU Surge Logo" />

NPM package scripts for our projects.

[![TypeScript](https://github.com/sfusurge/styleguide/actions/workflows/typescript-surge-scripts.yml/badge.svg?branch=main)](https://github.com/sfusurge/styleguide/actions/workflows/surge-scripts.yml)

## Installation

This package provides preconfigured scripts for various types of projects. The features available specifically depend on what `@sfusurge` packages are installed. In general, however, you can use them like this:

**package.json:**

```json
{
    ...
    "scripts": {
        "build": "surge-scripts build",
        "test": "surge-scripts test",
        "format": "surge-scripts format"
    }
    ...
}
```
