#!/bin/bash
# Super simple Bash script to update the commit hash in App.js
# This script focuses on finding the exact line with the version string and updating it

# Get current commit hash
commitHash=$(git rev-parse HEAD)
echo "Using commit hash: $commitHash"

# Set App.js path
appJsPath="$(dirname "$0")/src/App.js"

# Check if the file exists
if [[ ! -f "$appJsPath" ]]; then
    echo "ERROR: App.js file not found at $appJsPath"
    exit 1
fi

# Create a temporary file
tempFile="$(dirname "$0")/src/App.js.tmp"

# Process the file line by line
while IFS= read -r line; do
    if [[ "$line" =~ const[[:space:]]+VERSION[[:space:]]*=[[:space:]]*\".*\" ]]; then
        echo "Found VERSION constant in App.js"
        echo "const VERSION = \"$commitHash\"" >> "$tempFile"
    else
        echo "$line" >> "$tempFile"
    fi
done < "$appJsPath"

# Replace the original file
mv "$tempFile" "$appJsPath"

# Verify the change
if grep -q "const VERSION = \"$commitHash\"" "$appJsPath"; then
    echo "SUCCESS: Commit hash updated successfully!"
    exit 0
else
    echo "ERROR: Failed to update commit hash."
    exit 2
fi