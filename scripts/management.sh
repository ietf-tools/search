#!/bin/bash

if [ -z "$SCRIPT_PATH" ] ; then
    echo "Missing script argument!"
    exit 1
fi

echo "Fetching latest schemas and scripts..."
degit ietf-tools/search latest

echo "Moving things into place..."
mv latest/presets presets
mv latest/schemas schemas
mv latest/scripts scripts

echo "Running script..."
node $SCRIPT_PATH
