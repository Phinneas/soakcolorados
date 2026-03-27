#!/bin/bash

# Test script to verify Teable connection

echo "🔍 Testing Teable Connection"
echo "=============================="
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ jq is not installed"
    echo ""
    echo "Install jq:"
    echo "  macOS: brew install jq"
    echo "  Ubuntu/Debian: sudo apt-get install jq"
    exit 1
fi

echo "✅ jq is installed"

# Check if API token is set
if [ -z "$TEABLE_API_TOKEN" ]; then
    echo ""
    echo "❌ TEABLE_API_TOKEN is not set"
    echo ""
    echo "To set it:"
    echo "  export TEABLE_API_TOKEN='your_token_here'"
    echo ""
    echo "Or create a .env file and run:"
    echo "  source .env"
    exit 1
fi

echo "✅ TEABLE_API_TOKEN is set"
echo "   Token preview: ${TEABLE_API_TOKEN:0:10}..."

# Test connection
TEABLE_BASE_URL="https://teable-snickers-u27640.vm.elestio.app"
TABLE_ID="tbl0ZdZarej0x4Pv7lG"

echo ""
echo "📡 Testing API connection..."
echo "   URL: $TEABLE_BASE_URL"
echo "   Table ID: $TABLE_ID"
echo ""

response=$(curl -s -X GET "$TEABLE_BASE_URL/api/table/$TABLE_ID/record?take=1" \
  -H "Authorization: Bearer $TEABLE_API_TOKEN" \
  -w "\nHTTP_STATUS:%{http_code}\n" )

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed -n '/^{/,/^}/p')

echo "HTTP Status: $http_status"

echo ""

if [ "$http_status" = "200" ]; then
    echo "✅ Connection successful!"
    echo ""
    echo "Sample record:"
    echo "$body" | jq '.records[0].fields | {Name, slug, temp_f}' 2>/dev/null || echo "Could not parse response"
elif [ "$http_status" = "401" ]; then
    echo "❌ Authentication failed (401)"
    echo ""
    echo "Possible issues:"
    echo "  - API token is incorrect"
    echo "  - Token has expired"
    echo "  - Token doesn't have access to this table"
    echo ""
    echo "To fix:"
    echo "  1. Go to Teable > Profile > Personal Access Token"
    echo "  2. Generate a new token"
    echo "  3. Set it: export TEABLE_API_TOKEN='new_token'"
elif [ "$http_status" = "403" ]; then
    echo "❌ Access forbidden (403)"
    echo ""
    echo "Your token doesn't have permission to access this table."
elif [ "$http_status" = "404" ]; then
    echo "❌ Table not found (404)"
    echo ""
    echo "Check that the table ID is correct: $TABLE_ID"
else
    echo "❌ Connection failed (HTTP $http_status)"
    echo ""
    echo "Response:"
    echo "$body" | jq . 2>/dev/null || echo "$body"
fi

echo ""
echo "=============================="
echo "Test complete"
