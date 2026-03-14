#!/bin/bash
cd /home/kavia/workspace/code-generation/data-asset-management-system-332590/data_asset_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

