#!/usr/bin/env bash
set -euo pipefail

# Replace the dependency versions.
# Anything that is `=0.0.0-set-by-ci` will be replaced with the current package version.
# This ensures that we always have version parity.
version="$(jq -r .version 'package.json')"
echo "Rewriting dependencies to $version"
jq '
    .dependencies = ((.dependencies // {}) | map_values(select(. == "=0.0.0-set-by-ci") = $version)) |
    .peerDependencies = ((.peerDependencies // {}) | map_values(select(. == "=0.0.0-set-by-ci") = $version)) |
    .devDependencies = ((.devDependencies // {}) | map_values(select(. == "=0.0.0-set-by-ci") = $version))
' --arg version "=$version" \
    < package.json \
    > package.json.new

mv package.json.new package.json
