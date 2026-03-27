#!/bin/bash

# Teable API Configuration
TEABLE_BASE_URL="https://teable-snickers-u27640.vm.elestio.app"
TABLE_ID="tbl0ZdZarej0x4Pv7lG"

# Check if API token is set
if [ -z "$TEABLE_API_TOKEN" ]; then
    echo "❌ Error: TEABLE_API_TOKEN environment variable not set"
    echo ""
    echo "Please set your Teable API token first:"
    echo "   export TEABLE_API_TOKEN='your_token_here'"
    echo ""
    echo "Or create a .env file:"
    echo "   echo 'TEABLE_API_TOKEN=your_token_here' > .env"
    echo "   source .env"
    exit 1
fi

echo "🔄 Syncing data from Teable..."
echo "📡 API Endpoint: $TEABLE_BASE_URL"
echo "📋 Table ID: $TABLE_ID"
echo ""

# Fetch all records from Teable
response=$(curl -s -X GET "$TEABLE_BASE_URL/api/table/$TABLE_ID/record?fieldKeyType=name" \
  -H "Authorization: Bearer $TEABLE_API_TOKEN")

# Check if curl was successful
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to connect to Teable API"
    exit 1
fi

# Check if the response contains an error
if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
    error_msg=$(echo "$response" | jq -r '.message // "Unknown error"')
    echo "❌ API Error: $error_msg"
    exit 1
fi

# Transform Teable data to springs.json format
echo "$response" | jq '[.records[] | {
  name: .fields.Name,
  slug: .fields.slug,
  temp_f: (.fields.temp_f // null),
  fee: (.fields.fee // null),
  gps: .fields.gps,
  description: .fields.description,
  access_type: .fields.Access_Type,
  hours: .fields.Hours,
  season: .fields.Season,
  clothing: .fields.Clothing,
  cell_coverage: .fields.Cell_Coverage,
  road_condition: .fields.Road_Condition,
  parking: .fields.Parking,
  fee_notes: .fields.Fee_Notes,
  best_time: .fields.Best_Time_to_Visit,
  avoid_when: .fields.Avoid_When,
  insider_tips: .fields.Insider_Tips,
  nearby_gems: .fields.Nearby_Gems,
  last_verified: .fields.Last_Verified,
  maintenance_day: .fields.Maintenance_Day,
  alerts: .fields.Alerts
} | with_entries(select(.value != null and .value != ""))]' > data/springs.json

if [ $? -eq 0 ]; then
    echo "✅ Successfully synced $(jq '. | length' data/springs.json) hot springs from Teable"
    echo "📄 Data saved to data/springs.json"
    
    # Show a preview
    echo ""
    echo "Preview:"
    jq '.[0] | {name, slug, temp_f, access_type, last_verified}' data/springs.json
    
    # Optionally update the content files
    echo ""
    read -p "Update Hugo content files? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Running build-pages.sh..."
        ./build-pages.sh
        echo "✅ Content files updated"
    fi
else
    echo "❌ Error: Failed to transform and save data"
    exit 1
fi
