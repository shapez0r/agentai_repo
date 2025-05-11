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

mainJsRel=$(jq -r '.files["main.js"]' "$manifestPath")
if [[ -z "$mainJsRel" || "$mainJsRel" == "null" ]]; then
    echo "ERROR: main.js path not found in asset-manifest.json."
    exit 1
fi

# Get current commit hash
commitHash=$(git rev-parse HEAD)

# 2. Build full URL for check
baseUrl="https://shapez0r.github.io"
jsUrl="$baseUrl$mainJsRel"
cssUrl="$baseUrl$(jq -r '.files["main.css"]' "$manifestPath")"

# Define features to check - each feature must have an ID, name, and search pattern
declare -A featuresToCheck=(
    ["1"]="Supertester"
    ["2"]="ru.{0,20}connectionTester|connectionTester.{0,20}ru|ru.{0,30}Tester"
    ["3"]="es.*Supertester|Supertester.*es"
    ["4"]="de.*Supertester|Supertester.*de"
    ["5"]="rainbow-title"
    ["6"]="rainbow-text"
    ["7"]="Moscow"
    ["8"]="London"
    ["9"]="New York"
    ["10"]="Singapore"
    ["11"]="Sao Paulo"
    ["12"]="Mumbai"
    ["13"]="Sydney"
    ["14"]="Johannesburg"
    ["15"]="Tokyo"
    ["16"]="Toronto"
    ["17"]="Toronto.*es|es.*Toronto"
    ["18"]="New York"
    ["19"]="Singapore"
    ["20"]="getPingColor|function.*ping.*color"
    ["21"]="minPing|10.*ms|\\\\&lt;10ms"
    ["22"]="maxPing|1000.*ms|\\\\&gt;1000ms" 
    ["23"]="MapContainer|TileLayer|Marker|Popup|Tooltip" 
    ["24"]="leaflet"
    ["25"]="createMarkerIcon|custom-ping-marker|300 ms"
    ["26"]="worldLatencyMap|World.*Latency.*Map|Карта.*задержек"
    ["27"]="setInterval.*testPing|pingTestIntervalMs.*5000|pingTestIntervalMs\\/1000|автообновления.*пинга|interval.*ping"
    ["28"]="v\..*IP|VERSION.*IP"
    ["29"]="display.*flex.*gap.*20px.*карт|карты|map"
    ["30"]="width.*75%.*height.*400px"
    ["31"]="width.*25%.*compact|small"
    ["32"]="speed\\-ewr\\.cloudflare\\.com|speed\\-sin\\.cloudflare\\.com|speed\\-gru\\.cloudflare\\.com|speed\\-bom\\.cloudflare\\.com|speed\\-syd\\.cloudflare\\.com|speed\\-jnb\\.cloudflare\\.com|speed\\-nrt\\.cloudflare\\.com|speed\\-yyz\\.cloudflare\\.com"
    ["33"]="updating.*:..*\\||t\\.updating"
    ["34"]="cache:.no-store|Cache-Control.*no-cache|Pragma.*no-cache"
    ["35"]="speed\\-.*\\.cloudflare\\.com/__down\\?bytes=1000"
)

# Timeout and interval settings
timeoutSec=40
intervalSec=5
start=$(date +%s)
found=false

# Check for commit hash first
echo "Checking URL: $jsUrl for commit hash $commitHash"
while (( $(date +%s) - start < timeoutSec )); do
    content=$(curl -s "$jsUrl")
    if [[ "$content" =~ "$commitHash" ]]; then
        echo "Commit hash FOUND: $commitHash"
        found=true
        break
    else
        echo "Commit hash not found yet, retrying..."
        sleep $intervalSec
    fi
done

if [[ "$found" == false ]]; then
    echo "ERROR: Commit hash not found in $timeoutSec seconds."
    exit 1
fi

# Reset timer for the next check
start=$(date +%s)
found=false

# Get JS and CSS content
jsContent=$(curl -s "$jsUrl")
cssContent=$(curl -s "$cssUrl")

# Check for all features
echo -e "\n============ FEATURE CHECK RESULTS ============"
echo "Checking deployed files for required features..."
declare -A categoryCounts
foundFeatures=0
totalFeatures=${#featuresToCheck[@]}

for id in "${!featuresToCheck[@]}"; do
    pattern="${featuresToCheck[$id]}"
    contentToCheck="$jsContent"
    # For CSS-specific features, check CSS content too
    if [[ "$id" -eq 5 || "$id" -eq 6 ]]; then
        contentToCheck="$jsContent$cssContent"
    fi

    if [[ "$contentToCheck" =~ $pattern ]]; then
        echo "[✓] Feature #$id: $pattern"
        ((foundFeatures++))
    else
        echo "[✗] Feature #$id: $pattern - NOT FOUND"
    fi
done

# Display summary
echo -e "\n============ TEST SUMMARY ============"
echo "Features found: $foundFeatures of $totalFeatures"

if (( foundFeatures >= 3 )); then
    echo -e "\nTEST PASSED: Found at least 3 required features"
    exit 0
else
    echo -e "\nTEST FAILED: Didn't find enough required features"
    exit 1
fi