#!/bin/bash

echo "🔄 Building Hugo content files from data/springs.json..."

# Check if springs.json exists
if [ ! -f "data/springs.json" ]; then
    echo "❌ Error: data/springs.json not found"
    exit 1
fi

# Create directory if it doesn't exist
mkdir -p content/springs

# Process each spring record
jq -c '.[]' data/springs.json | while read -r spring; do
    name=$(echo "$spring" | jq -r '.name')
    slug=$(echo "$spring" | jq -r '.slug')
    temp_f=$(echo "$spring" | jq -r '.temp_f // empty')
    fee=$(echo "$spring" | jq -r '.fee // empty')
    gps=$(echo "$spring" | jq -r '.gps // empty')
    description=$(echo "$spring" | jq -r '.description // empty')
    access_type=$(echo "$spring" | jq -r '.access_type // empty')
    hours=$(echo "$spring" | jq -r '.hours // empty')
    season=$(echo "$spring" | jq -r '.season // empty')
    clothing=$(echo "$spring" | jq -r '.clothing // empty')
    cell_coverage=$(echo "$spring" | jq -r '.cell_coverage // empty')
    road_condition=$(echo "$spring" | jq -r '.road_condition // empty')
    parking=$(echo "$spring" | jq -r '.parking // empty')
    fee_notes=$(echo "$spring" | jq -r '.fee_notes // empty')
    best_time=$(echo "$spring" | jq -r '.best_time // empty')
    avoid_when=$(echo "$spring" | jq -r '.avoid_when // empty')
    insider_tips=$(echo "$spring" | jq -r '.insider_tips // empty')
    nearby_gems=$(echo "$spring" | jq -r '.nearby_gems // empty')
    last_verified=$(echo "$spring" | jq -r '.last_verified // empty')
    maintenance_day=$(echo "$spring" | jq -r '.maintenance_day // empty')
    alerts=$(echo "$spring" | jq -r '.alerts // empty')
    
    # Build frontmatter
    frontmatter="---\ntitle: \"${name} Hot Springs\"\nname: \"${name}\"\ntype: springs"
    
    # Add fields only if they have values
    [ ! -z "$temp_f" ] && frontmatter="${frontmatter}\ntemp_f: ${temp_f}"
    [ ! -z "$fee" ] && frontmatter="${frontmatter}\nfee: ${fee}"
    [ ! -z "$gps" ] && frontmatter="${frontmatter}\ngps: \"${gps}\""
    [ ! -z "$description" ] && frontmatter="${frontmatter}\ndescription: \"${description}\""
    [ ! -z "$access_type" ] && frontmatter="${frontmatter}\naccess_type: \"${access_type}\""
    [ ! -z "$hours" ] && frontmatter="${frontmatter}\nhours: \"${hours}\""
    [ ! -z "$season" ] && frontmatter="${frontmatter}\nseason: \"${season}\""
    [ ! -z "$clothing" ] && frontmatter="${frontmatter}\nclothing: \"${clothing}\""
    [ ! -z "$cell_coverage" ] && frontmatter="${frontmatter}\ncell_coverage: \"${cell_coverage}\""
    [ ! -z "$road_condition" ] && frontmatter="${frontmatter}\nroad_condition: \"${road_condition}\""
    [ ! -z "$parking" ] && frontmatter="${frontmatter}\nparking: \"${parking}\""
    [ ! -z "$fee_notes" ] && frontmatter="${frontmatter}\nfee_notes: \"${fee_notes}\""
    [ ! -z "$best_time" ] && frontmatter="${frontmatter}\nbest_time: \"${best_time}\""
    [ ! -z "$avoid_when" ] && frontmatter="${frontmatter}\navoid_when: \"${avoid_when}\""
    [ ! -z "$insider_tips" ] && frontmatter="${frontmatter}\ninsider_tips: \"${insider_tips}\""
    [ ! -z "$nearby_gems" ] && frontmatter="${frontmatter}\nnearby_gems: \"${nearby_gems}\""
    [ ! -z "$last_verified" ] && frontmatter="${frontmatter}\nlast_verified: \"${last_verified}\""
    [ ! -z "$maintenance_day" ] && frontmatter="${frontmatter}\nmaintenance_day: \"${maintenance_day}\""
    [ ! -z "$alerts" ] && frontmatter="${frontmatter}\nalerts: \"${alerts}\""
    
    frontmatter="${frontmatter}\n---\n\n"
    
    # Build content
    content="# ${name} Hot Springs\n\n${description}\n\n"
    [ ! -z "$temp_f" ] && content="${content}**Temperature:** ${temp_f}°F  \n"
    [ ! -z "$fee" ] && content="${content}**Fee:** \$${fee}  \n"
    [ ! -z "$gps" ] && content="${content}**GPS:** ${gps}  \n"
    [ ! -z "$access_type" ] && content="${content}**Access:** ${access_type}  \n"
    [ ! -z "$hours" ] && content="${content}**Hours:** ${hours}  \n"
    [ ! -z "$season" ] && content="${content}**Season:** ${season}  \n"
    [ ! -z "$clothing" ] && content="${content}**Clothing:** ${clothing}  \n"
    
    if [ ! -z "$road_condition" ] || [ ! -z "$parking" ] || [ ! -z "$cell_coverage" ]; then
        content="${content}\n## Access & Logistics\n\n"
        [ ! -z "$road_condition" ] && content="${content}**Road Condition:** ${road_condition}  \n"
        [ ! -z "$parking" ] && content="${content}**Parking:** ${parking}  \n"
        [ ! -z "$cell_coverage" ] && content="${content}**Cell Coverage:** ${cell_coverage}  \n"
    fi
    
    [ ! -z "$fee_notes" ] && content="${content}\n## Fees & Payment\n\n**Fee Notes:** ${fee_notes}  \n"
    
    if [ ! -z "$best_time" ] || [ ! -z "$avoid_when" ] || [ ! -z "$maintenance_day" ]; then
        content="${content}\n## When to Visit\n\n"
        [ ! -z "$best_time" ] && content="${content}**Best Time:** ${best_time}  \n"
        [ ! -z "$avoid_when" ] && content="${content}**Avoid When:** ${avoid_when}  \n"
        [ ! -z "$maintenance_day" ] && content="${content}**Maintenance:** ${maintenance_day}  \n"
    fi
    
    [ ! -z "$insider_tips" ] && content="${content}\n## Insider Tips\n\n${insider_tips}\n"
    [ ! -z "$nearby_gems" ] && content="${content}\n## Nearby Gems\n\n${nearby_gems}\n"
    
    if [ ! -z "$last_verified" ] || [ ! -z "$alerts" ]; then
        content="${content}\n## Current Status\n\n"
        [ ! -z "$last_verified" ] && content="${content}**Last Verified:** ${last_verified}  \n"
        [ ! -z "$alerts" ] && content="${content}**Alerts:** ${alerts}  \n"
    fi
    
    # Write file
    echo -e "${frontmatter}${content}" > "content/springs/${slug}.md"
    echo "✅ Generated content/springs/${slug}.md"
done

echo ""
echo "🎉 All Hugo content files generated successfully!"
