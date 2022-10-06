#!/usr/bin/env bash
set -euo pipefail
modules=(
    ../../package/surge-scripts
    ../eslint
    ../prettier
)

# Replace the dependency versions.
touch ci-setup.started
bash "../../ci-update-deps.sh"
bash "../../ci-init-deps.sh" "${modules[@]}"

# Link the modules so we don't need to wait for each to publish one after the other.
printf "Setting up module: %s\n" "$(basename -- "$(pwd)")"
npm link "${modules[@]}"
