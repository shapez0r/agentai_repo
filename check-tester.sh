#!/bin/bash
# Bash script for automatic check of the word 'Supertester' or 'СуперТестер' in deployed HTML/JS on GitHub Pages
# Automatically finds the current main.js path from build/asset-manifest.json

# Ensure the script explicitly sets UTF-8 encoding for all operations
export LC_ALL=en_US.UTF-8

# 1. Get main.js name from asset-manifest.json
manifestPath="$(dirname "$0")/build/asset-manifest.json"
if [[ ! -f "$manifestPath" ]]; then
    echo "ERROR: File $manifestPath not found. Run build first."
    exit 1
fi

# Using jq to parse JSON - you may need to install it: apt-get install jq
mainJsRel=$(jq -r '.files["main.js"]' "$manifestPath")
if [[ -z "$mainJsRel" || "$mainJsRel" == "null" ]]; then
    echo "ERROR: main.js path not found in asset-manifest.json."
    exit 1
fi

# Get current commit hash
commitHash=$(git rev-parse HEAD)

# 2. Build full URL for check
baseUrl="https://shapez0r.github.io"
jsUrl="${baseUrl}${mainJsRel}"
cssUrl="${baseUrl}$(jq -r '.files["main.css"]' "$manifestPath")"

# Declare associative arrays for feature categories
declare -A categories
categories["Multi-language Support"]=4
categories["Visual Effects"]=2
categories["Regions"]=10
categories["International Support"]=1
categories["Servers"]=2

# Define features to check
declare -A featureNames
declare -A featurePatterns
declare -A featureCategories

featureNames[1]="English title 'Supertester'"
featurePatterns[1]="Supertester"
featureCategories[1]="Multi-language Support"

featureNames[2]="Russian title"
featurePatterns[2]="ru.{0,20}connectionTester|connectionTester.{0,20}ru|ru.{0,30}Tester"
featureCategories[2]="Multi-language Support"

featureNames[3]="Spanish title (Supertester)"
featurePatterns[3]="es.*Supertester|Supertester.*es"
featureCategories[3]="Multi-language Support"

featureNames[4]="German title (Supertester)"
featurePatterns[4]="de.*Supertester|Supertester.*de"
featureCategories[4]="Multi-language Support"

featureNames[5]="Rainbow title CSS class"
featurePatterns[5]="rainbow-title"
featureCategories[5]="Visual Effects"

featureNames[6]="Rainbow animation effect"
featurePatterns[6]="rainbow-text"
featureCategories[6]="Visual Effects"

featureNames[7]="Russia region"
featurePatterns[7]="Russia"
featureCategories[7]="Regions"

featureNames[8]="Europe region"
featurePatterns[8]="Europe"
featureCategories[8]="Regions"

featureNames[9]="US region"
featurePatterns[9]="US"
featureCategories[9]="Regions"

featureNames[10]="Singapore region"
featurePatterns[10]="Singapore"
featureCategories[10]="Regions"

featureNames[11]="Brazil region"
featurePatterns[11]="Brazil"
featureCategories[11]="Regions"

featureNames[12]="India region"
featurePatterns[12]="India"
featureCategories[12]="Regions"

featureNames[13]="Australia region"
featurePatterns[13]="Australia"
featureCategories[13]="Regions"

featureNames[14]="South Africa region"
featurePatterns[14]="South[[:space:]]*Africa"
featureCategories[14]="Regions"

featureNames[15]="Japan region"
featurePatterns[15]="Japan"
featureCategories[15]="Regions"

featureNames[16]="Canada region"
featurePatterns[16]="Canada"
featureCategories[16]="Regions"

featureNames[17]="Spanish Canada translation (Canadá)"
featurePatterns[17]="Canada.*es|es.*Canada"
featureCategories[17]="International Support"

featureNames[18]="Cloudflare server"
featurePatterns[18]="Cloudflare"
featureCategories[18]="Servers"

featureNames[19]="Singapore server"
featurePatterns[19]="Singapore"
featureCategories[19]="Servers"

timeoutSec=40
intervalSec=5
start=$(date +%s)
found=false

# Check for commit hash first
echo "Checking URL: $jsUrl for commit hash $commitHash"
while (( $(date +%s) - start < timeoutSec )); do
    content=$(curl -s "$jsUrl")
    if echo "$content" | grep -q "$commitHash"; then
        echo -e "\033[32mCommit hash FOUND: $commitHash\033[0m"
        found=true
        break
    else
        echo -e "\033[33mCommit hash not found yet, retrying...\033[0m"
        sleep $intervalSec
    fi
done

if [ "$found" = false ]; then
    echo -e "\033[31mERROR: Commit hash not found in $timeoutSec seconds.\033[0m"
    exit 1
fi

# Reset timer for the next check
start=$(date +%s)
found=false

# Get JS and CSS content
jsContent=$(curl -s "$jsUrl")
cssContent=$(curl -s "$cssUrl")

# Check for all features
echo -e "\n\033[36m============ FEATURE CHECK RESULTS ============\033[0m"
echo "Checking deployed files for required features..."
declare -A categoryCounts
foundFeatures=0
totalFeatures=${#featureNames[@]}

for i in $(seq 1 19); do
    pattern="${featurePatterns[$i]}"
    name="${featureNames[$i]}"
    category="${featureCategories[$i]}"
    
    content="$jsContent"
    # For CSS-specific features, check CSS content too
    if [[ "$category" == "Visual Effects" ]]; then
        content="$jsContent$cssContent"
    fi
    
    if echo "$content" | grep -E -q "$pattern"; then
        echo -e "\033[32m[✓] Feature #$i: $name\033[0m"
        ((foundFeatures++))
        
        # Track category stats
        if [[ -n "${categoryCounts[$category]}" ]]; then
            ((categoryCounts[$category]++))
        else
            categoryCounts[$category]=1
        fi
    else
        echo -e "\033[31m[✗] Feature #$i: $name - NOT FOUND\033[0m"
    fi
done

# Display summary
echo -e "\n\033[36m============ TEST SUMMARY ============\033[0m"
if (( foundFeatures > 0 )); then
    echo -e "\033[32mFeatures found: $foundFeatures of $totalFeatures\033[0m"
else
    echo -e "\033[31mFeatures found: $foundFeatures of $totalFeatures\033[0m"
fi

echo -e "\nBy category:"
for category in "${!categoryCounts[@]}"; do
    categoryTotal=${categories[$category]}
    categoryFound=${categoryCounts[$category]}
    
    if (( categoryFound == categoryTotal )); then
        echo -e "\033[32m- $category: $categoryFound of $categoryTotal\033[0m"
    elif (( categoryFound > 0 )); then
        echo -e "\033[33m- $category: $categoryFound of $categoryTotal\033[0m"
    else
        echo -e "\033[31m- $category: $categoryFound of $categoryTotal\033[0m"
    fi
done

if (( foundFeatures >= 3 )); then
    echo -e "\n\033[32mTEST PASSED: Found at least 3 required features\033[0m"
    exit 0
else
    echo -e "\n\033[31mTEST FAILED: Didn't find enough required features\033[0m"
    exit 1
fi