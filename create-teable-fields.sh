#!/bin/bash

export TEABLE_API_TOKEN="teable_acc0p7QMINYgnXfG2Z0_onql/XkugERDz0y1oBaieThiOX/hxHrpy0YV6uEkPhk="
TABLE_ID="tbl0ZdZarej0x4Pv7lG"
BASE_URL="https://teable-snickers-u27640.vm.elestio.app"

echo "🔄 Creating all fields in Teable table..."
echo ""

# Create field function (simplified - no jq dependency for now)
create_field() {
  local name=$1
  local type=$2
  
  echo -n "  Creating '$name' ($type)... "
  
  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/table/$TABLE_ID/field" \
    -H "Authorization: Bearer $TEABLE_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"type\":\"$type\"}")
  
  http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
  
  if [ "$http_status" = "201" ] || [ "$http_status" = "200" ]; then
    echo "✅"
  else
    echo "❌ (HTTP $http_status)"
  fi
}

# Create all required fields
echo "1. Creating text fields..."
create_field "name" "singleLineText"
create_field "slug" "singleLineText" 
create_field "gps" "singleLineText"
create_field "access_type" "singleLineText"
create_field "hours" "singleLineText"
create_field "season" "singleLineText"
create_field "clothing" "singleLineText"
create_field "cell_coverage" "singleLineText"
create_field "road_condition" "singleLineText"
create_field "parking" "singleLineText"
create_field "fee_notes" "singleLineText"
create_field "best_time" "singleLineText"
create_field "avoid_when" "singleLineText"
create_field "maintenance_day" "singleLineText"

echo ""
echo "2. Creating number fields..."
create_field "temp_f" "number"
create_field "fee" "number"

echo ""
echo "3. Creating long text fields..."
create_field "description" "longText"
create_field "insider_tips" "longText"
create_field "nearby_gems" "longText"

echo ""
echo "4. Creating date field..."
create_field "last_verified" "date"

echo ""
echo "🎉 Field creation complete!"
echo ""
echo "Verifying fields in table..."
curl -s -X GET "$BASE_URL/api/table/$TABLE_ID/field" \
  -H "Authorization: Bearer $TEABLE_API_TOKEN" | jq '.[].name'
