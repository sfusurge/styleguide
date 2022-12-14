# SFU Surge Style Guide

<img src=".github/assets/surge.svg" alt="SFU Surge Logo" />

A style guide and shared configuration for our web development projects.

## Guide

TODO

## Presets

- [@sfusurge/prettier-config](config/prettier) (`prettier`)
- [@sfusurge/eslint-config](config/eslint) (`eslint`)
- [@sfusurge/craco-config](config/craco) (`craco`)
- [@sfusurge/typescript-config](config/typescript) (`typescript`)
- [@sfusurge/typescript-react-config](config/typescript-react) (`typescript`, for React components)
- [@sfusurge/typescript-react-site](config/typescript-react-site) (`typescript`, for React websites)

## Using GitHub Actions

In order to properly use the presets within the GitHub Actions CI environment, you first need to add repository access on `https://github.com/orgs/sfusurge/packages/npm/<package-name>/settings` for each preset.

## Contributing

To release a new package, create and push a new tag in the format of `v1.2.3`. The CI will automatically publish the packages with the version `1.2.3`.
