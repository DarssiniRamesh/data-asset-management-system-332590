#!/bin/bash
set -euo pipefail

cd /home/kavia/workspace/code-generation/data-asset-management-system-332590/data_asset_frontend

# Ensure dependencies are in sync with package.json before building.
# This prevents TypeScript builds from failing due to missing @types/* packages.
npm install

npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  exit 1
fi

