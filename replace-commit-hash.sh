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

# Read the entire file
content=$(<"$appJsPath")

# Look for the VERSION constant line
if [[ "$content" =~ const\ VERSION\ =\ \".*?\" ]]; then
    echo "Found VERSION constant in App.js"

    # Prepare the replacement string with the commit hash
    replacement="const VERSION = \"$commitHash\""

    # Replace the version string directly
    newContent=$(echo "$content" | sed -E "s/const VERSION = \".*?\"/$replacement/")

    # Write back to the file
    echo "$newContent" > "$appJsPath"

    # Verify the change
    if grep -q "$replacement" "$appJsPath"; then
        echo "SUCCESS: Commit hash updated successfully!"
        exit 0
    else
        echo "ERROR: Failed to update commit hash."
        exit 2
    fi
else
    echo "ERROR: Could not find VERSION constant in App.js"
    echo "Ensure App.js contains a line with 'const VERSION = ' text"
    exit 3
fi