#!/bin/bash
# Bash script for automatic check of the word 'Supertester' or 'СуперТестер' in deployed HTML/JS on GitHub Pages

# Ensure the script explicitly sets UTF-8 encoding for all operations
export LC_ALL=en_US.UTF-8

# Get current commit hash
commitHash=$(git rev-parse HEAD)

# Build URLs for check
baseUrl="https://shapez0r.github.io/agentai_repo/connection-tester"
jsUrl="$baseUrl/static/js/main.d43acf30.js"
cssUrl="$baseUrl/static/css/main.056b00b8.css"

echo "Checking URL: $jsUrl for commit hash $commitHash"

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
    ["39"]="mos\\.ru"
    ["40"]="x-small|fontSize.*11px|fontSize.*9px"
    ["22"]="maxPing|1000.*ms|\\\\&gt;1000ms" 
    ["23"]="MapContainer|TileLayer|Marker|Popup|Tooltip" 
    ["24"]="leaflet"
    ["25"]="createMarkerIcon|custom-ping-marker|300 ms"
    ["26"]="worldLatencyMap|World.*Latency.*Map|Карта.*задержек"
    ["27"]="setInterval.*testPing|pingTestIntervalMs.*5000|pingTestIntervalMs.*1000|автообновления.*пинга|interval.*ping|Настройка.*пинга|clearInterval"
    ["28"]="v\..*IP|VERSION.*IP"
    ["29"]="display.*flex.*gap.*20px.*карт|карты|map"
    ["30"]="width.*75%.*height.*500px"
    ["31"]="width.*25%.*compact|small"
    ["32"]="gov\\.uk|ny\\.gov|gov\\.sg|gov\\.br|india\\.gov\\.in|australia\\.gov\\.au|gov\\.za|japan\\.go\\.jp|canada\\.ca"
    ["33"]="updating.*:..*\\||t\\.updating"
    ["34"]="cache:.no-store|Cache-Control.*no-cache|Pragma.*no-cache"
    ["35"]="government|university|moscow\\.ru"
    ["36"]="pingCache|const pingCache|кеш.*пинга|cache.*ping"
    ["37"]="ВСЕГДА используем кешированное значение|всегда отража.*предыдущ.*значени.*пинга"
    ["38"]="ВАЖНО: Copilot должен всегда отвечать.*ТОЛЬКО НА РУССКОМ ЯЗЫКЕ"
    ["41"]="loading-screen|Измеряем скорость соединения"
    ["42"]="testingPing.*true.*показа экрана загрузки"
    ["43"]="click.*async.*bestLatency|click.*async.*testEndpointLatency|successfulMeasurement.*bestLatency"
    ["44"]="clickToUpdate|Нажмите для обновления"
    ["45"]="size.*24.*Увеличенный размер маркера"
    ["46"]="backdrop-filter.*blur"
    ["47"]="transform.*scale.*1\\.2"
    ["48"]="measureWebRTCLatency|RTCPeerConnection|createDataChannel"
    ["49"]="speedtest\\.london\\.linode\\.com|speedtest-nyc1\\.digitalocean\\.com|speedtest\\.singapore\\.linode\\.com"
    ["50"]="dns\\.google\\.com|dns\\.cloudflare\\.com"
    ["51"]="testEndpointLatency|multiple.*methods|WebRTC.*TCP"
    ["52"]="bestLatency.*Infinity|successfulMeasurement"
    ["53"]="speedtest\\.cybersmart\\.co\\.za"
    ["54"]="Promise\\.race.*timeout.*3000"
    ["55"]="setTestingPing.*false.*immediately"
    ["56"]="Загрузка\\.\\.\\."
    ["57"]="speedtest\\.afrihost\\.com|speedtest\\.rain\\.co\\.za"
    ["58"]="speedtest\\.brisanet\\.com\\.br|speedtest-gru\\.phoenixnap\\.com"
    ["59"]="speedtest\\.optus\\.net\\.au|speedtest\\.telstra\\.net"
)

# Timeout and interval settings
timeoutSec=40
intervalSec=5
start=$(date +%s)
found=false

# Check for commit hash first
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

if (( foundFeatures == totalFeatures )); then
    echo -e "\nTEST PASSED: Found all required features"
    exit 0
else
    echo -e "\nTEST FAILED: Missing some required features"
    exit 1
fi