#!/usr/bin/env bash
set -euo pipefail
modules=(
    ../../config/prettier
    ../../config/eslint
    ../../config/typescript
)

# Replace the dependency versions.
touch ci-setup.started
bash "../../ci-update-deps.sh"
bash "../../ci-init-deps.sh" "${modules[@]}"

# Link the modules so we don't need to wait for each to publish one after the other.
printf "Setting up module: %s\n" "$(basename -- "$(pwd)")"
npm link "${modules[@]}"

# Compile surge-scripts, or else nothing else can use them.
if [ -n "${GITHUB:-}" ]; then echo "::group::Build surge-scripts"; fi
npm run build
if [ -n "${GITHUB:-}" ]; then echo "::endgroup"; fi
