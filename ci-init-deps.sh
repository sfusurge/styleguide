#!/usr/bin/env bash
set -euo pipefail

# Initialize dependent modules (provided as a relative path).
# This ensures that testing will always work.
touch ci-setup.started # Prevent cycles

for module in "$@"; do 
    ({
        cd "$module"
        if ! [ -f ci-setup.started ]; then
            touch ci-setup.started

            if [ -f ci-setup.sh ]; then
                bash ci-setup.sh
            else
                npm ci
            fi
        fi
    })
done
