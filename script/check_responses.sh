#!/usr/bin/env bash

LOCAL_URL="http://localhost:3000/api/generateCoverImage"
LIVE_URL="https://cover-craft-seven.vercel.app/api/generateCoverImage"

echo "Select the environment to send the requests to:"
echo "1) Local ($LOCAL_URL)"
echo "2) Live ($LIVE_URL)"
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
  URL="$LOCAL_URL"
elif [ "$choice" = "2" ]; then
  URL="$LIVE_URL"
else
  echo "Invalid choice. Defaulting to Local."
  URL="$LOCAL_URL"
fi


send() {
  local body="$1"
  echo -e "\n----"
  echo "Request payload: $body"
  echo "POST $URL"
  curl -X "\nHTTP: %{http_code}\n" -X POST "$URL" \
    -H "Content-Type: application/json" \
    -d "$body" \
    | jq
  echo -e "\n----"

  sleep 2
}

# Case 1: width less than minimum (width < 1)
PAYLOAD='{"width":0,"height":400,"backgroundColor":"#ffffff","textColor":"#000000","font":"Montserrat","title":"Width Too Small","filename":"case-width-small"}'
send "$PAYLOAD"

# Case 2: width greater than maximum (width > 1200)
PAYLOAD='{"width":1201,"height":400,"backgroundColor":"#ffffff","textColor":"#000000","font":"Montserrat","title":"Width Too Large","filename":"case-width-large"}'
send "$PAYLOAD"

# Case 3: height less than minimum (height < 1)
PAYLOAD='{"width":400,"height":0,"backgroundColor":"#ffffff","textColor":"#000000","font":"Montserrat","title":"Height Too Small","filename":"case-height-small"}'
send "$PAYLOAD"

# Case 4: height greater than maximum (height > 1200)
PAYLOAD='{"width":400,"height":1201,"backgroundColor":"#ffffff","textColor":"#000000","font":"Montserrat","title":"Height Too Large","filename":"case-height-large"}'
send "$PAYLOAD"

# Case 5: title longer than 55 characters (56 chars)
LONG_TITLE=$(printf 'a%.0s' {1..56})
PAYLOAD="{\"width\":400,\"height\":400,\"backgroundColor\":\"#ffffff\",\"textColor\":\"#000000\",\"font\":\"Montserrat\",\"title\":\"$LONG_TITLE\",\"filename\":\"case-title-too-long\"}"
send "$PAYLOAD"

# Case 6: subtitle longer than 120 characters (121 chars)
LONG_SUBTITLE=$(printf 'b%.0s' {1..121})
PAYLOAD="{\"width\":400,\"height\":400,\"backgroundColor\":\"#ffffff\",\"textColor\":\"#000000\",\"font\":\"Montserrat\",\"title\":\"Subtitle Too Long (trigger)\",\"subtitle\":\"$LONG_SUBTITLE\",\"filename\":\"case-subtitle-too-long\"}"
send "$PAYLOAD"

# Case 7: poor contrast (below 4.5:1)
PAYLOAD='{"width":400,"height":400,"backgroundColor":"#ffffff","textColor":"#ffff00","font":"Montserrat","title":"Poor Contrast","filename":"case-contrast-poor"}'
send "$PAYLOAD"

# Case 8: invalid font choice
PAYLOAD='{"width":1080,"height":1080,"backgroundColor":"#ffffff","textColor":"#000000","font":"InvalidFont","title":"Invalid Font Choice","filename":"case-invalid-font"}'
send "$PAYLOAD"

# Done
echo -e "\nAll requests finished. Check the HTTP status codes (expected 400 for validation_error cases, 200 for success) to verify behavior.\n"