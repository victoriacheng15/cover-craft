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

echo
echo "Which test cases do you want to run?"
echo "1) Failed validation cases only"
echo "2) Success case only"
echo "3) All cases"
read -p "Enter choice (1, 2, or 3): " case_choice


send() {
  local body="$1"
  echo -e "\n----"
  echo "Request payload: $body"
  echo "POST $URL"
  # Use a temp file to capture headers and body
  RESPONSE_FILE=$(mktemp)
  HEADER_FILE=$(mktemp)
  curl -s -D "$HEADER_FILE" -o "$RESPONSE_FILE" -X POST "$URL" \
    -H "Content-Type: application/json" \
    -d "$body"
  CONTENT_TYPE=$(grep -i '^Content-Type:' "$HEADER_FILE" | awk '{print $2}' | tr -d '\r')
  if [[ "$CONTENT_TYPE" == application/json* ]]; then
    cat "$RESPONSE_FILE" | jq
  else
    OUTFILE="output-$(date +%s).bin"
    mv "$RESPONSE_FILE" "$OUTFILE"
    echo "Non-JSON response saved to $OUTFILE (Content-Type: $CONTENT_TYPE)"
  fi
  rm -f "$HEADER_FILE"
  # Only remove RESPONSE_FILE if not already moved
  [ -f "$RESPONSE_FILE" ] && rm -f "$RESPONSE_FILE"
  echo -e "\n----"
  sleep 2
}


# Define test cases
run_failed_cases() {
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
}

run_success_case() {
  # Case 9: valid payload (should succeed)
  PAYLOAD='{"width":800,"height":400,"backgroundColor":"#ffffff","textColor":"#000000","font":"Montserrat","title":"Valid Image","filename":"case-success"}'
  send "$PAYLOAD"
}

# Run selected cases
if [ "$case_choice" = "1" ]; then
  run_failed_cases
elif [ "$case_choice" = "2" ]; then
  run_success_case
else
  run_failed_cases
  run_success_case
fi

# Done
echo -e "\nAll requests finished. Check the HTTP status codes (expected 400 for validation_error cases, 200 for success) to verify behavior.\n"