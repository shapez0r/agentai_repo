#!/bin/bash

# Function to check if a string exists in the deployed files
check_string() {
    local search_string="$1"
    
    # Use dir command for Windows
    for file in build/static/js/*.js; do
        if grep -q "$search_string" "$file" 2>/dev/null; then
            echo "FOUND: $search_string in $file"
            return 0
        fi
    done
    
    echo "NOT FOUND: $search_string"
    return 1
}

# Check for new features
echo "Checking for Urals oil price feature..."
check_string "Urals"

echo "Checking for cloud overlay feature..."
check_string "ImageOverlay"

echo "Checking for Moscow coordinates..."
check_string "55.7558"

# Check that Apex functionality is removed
echo "Verifying Apex functionality is removed..."
if ! check_string "Apex"; then
    echo "VERIFIED: Apex functionality successfully removed"
fi 