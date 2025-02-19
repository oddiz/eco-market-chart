import json
from collections import defaultdict
from datetime import datetime
import re

from calculate_candlestick_data import calculate_candlestick_data

# Regex pattern to extract quantity, item name, and price per item
pattern = re.compile(
		r"(\d+)\s*X\s*([^*]+)\*\s*([\d.]+)\s*=\s*[\d.]+",  # Matches "QX Item * Price = Total"
		re.IGNORECASE
)
# Initialize a dictionary to store trades by item
trades_by_item = defaultdict(list)

# Read the JSON file 
with open("scripts/silverleaf.json", "r", encoding="utf-8") as input_file:
    data = json.load(input_file)
	

# Step 2: Parse the JSON data
for message in data['messages']:
    for embed in message['embeds']:
        for field in embed['fields']:
            if field['name'] == 'Bought':
                # Extract item details
                item_details = field['value'].split('\n')
                for detail in item_details:
                    detail = detail.strip()
                    if not detail or "Total" in detail:
                        continue  # Skip empty lines or "Total" lines
                    
                    # Use regex to parse the detail string
                    match = pattern.match(detail)
                    if match:
                        quantity = int(match.group(1))
                        item_name = match.group(2).strip()
                        price_per_item = float(match.group(3))
                        timestamp = message['timestamp']
                        
                        # Store the trade
                        trades_by_item[item_name].append({
                            "timestamp": timestamp,
                            "quantity": quantity,
                            "price_per_item": price_per_item,
                            "total_price": quantity * price_per_item
                        })
                    else:
                        print(f"Skipping unparsable detail: {detail}")

with open("scripts/output/trades_by_item.json", "w", encoding="utf-8") as output_file:
    json.dump(trades_by_item, output_file, indent=4)		
					
# Calculate candlestick data for each item
candlestick_data_by_item = {}
for item, trades in trades_by_item.items():
		candlestick_data_by_item[item] = calculate_candlestick_data(trades)

with open("scripts/output/candlestick_data_by_item.json", "w", encoding="utf-8") as output_file:
    json.dump(candlestick_data_by_item, output_file, indent=4)
    			
# Format data for Highcharts
highcharts_data = {}
for item, data in candlestick_data_by_item.items():
		highcharts_data[item] = [{
				'x': int(datetime.combine(entry[0], datetime.min.time()).timestamp() * 1000),
				'open': entry[1],
				'high': entry[2],
				'low': entry[3],
				'close': entry[4]
		} for entry in data]
  
# Step 3: Write the parsed data to output.json
with open("scripts/output/highcharts_data.json", "w", encoding="utf-8") as output_file:
    json.dump(highcharts_data, output_file, indent=4)

print("Data successfully written to output.json")
	