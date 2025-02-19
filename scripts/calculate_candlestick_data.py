import json
from datetime import datetime, timedelta,time
from dateutil import parser
from itertools import groupby
# Load the parsed data from output.json
with open("scripts/output/trades_by_item.json", "r", encoding="utf-8") as file:
    trades_by_item = json.load(file)

# Function to calculate OHLC data for X-hour periods
def calculate_ohlc(trades_by_item):
    ohlc_data_by_item = {}

    for item, trades in trades_by_item.items():
        if not trades:
            return []

        parsed_trades = []


        for trade in trades:
            dt = parser.parse(trade["timestamp"])
            local_dt = dt.astimezone(dt.tzinfo)
            interval_start_hour = (local_dt.hour // 4) * 4
            interval_start = local_dt.replace(hour=interval_start_hour, minute=0, second=0, microsecond=0)
            parsed_trades.append((interval_start, trade))
            
        parsed_trades.sort(key=lambda x: x[0])
        groups = []
        for key, group in groupby(parsed_trades, key=lambda x: x[0]):
            trades_in_group = [g[1] for g in group]
            groups.append((key, trades_in_group))
            
        dates = {interval_start.date() for interval_start, _ in parsed_trades}
        min_date = min(dates) if dates else None
        max_date = max(dates) if dates else None

        if not dates:
            return []
        
        tz = parsed_trades[0][0].tzinfo if parsed_trades else None
        all_intervals = []
        current_date = min_date
        while current_date <= max_date:
            for hour in [0, 4, 8, 12, 16, 20]:
                interval_start = datetime.combine(current_date, time(hour, 0), tzinfo=tz)
                all_intervals.append(interval_start)
            current_date += timedelta(days=1)
        all_intervals.sort()
        
        ohlc = []
        previous_close = None
        for interval_start in all_intervals:
            matched_group = next((g for g in groups if g[0] == interval_start), None)
            if matched_group:
                sorted_trades = sorted(matched_group[1], key=lambda x: parser.parse(x["timestamp"]))
                prices = [t["price_per_item"] for t in sorted_trades]
                quantities = [t["quantity"] for t in sorted_trades]
                open_price = prices[0] if prices else (previous_close if previous_close is not None else 0.0)
                high_price = max(prices) if prices else open_price
                low_price = min(prices) if prices else open_price
                close_price = prices[-1] if prices else open_price
                volume = sum(quantities)
                previous_close = close_price
            else:
                if previous_close is not None:
                    open_price = previous_close
                    high_price = previous_close
                    low_price = previous_close
                    close_price = previous_close
                else:
                    open_price = high_price = low_price = close_price = 0.0
                volume = 0
            
            time_str = interval_start.isoformat()
            ohlc.append([
                time_str,
                open_price,
                high_price,
                low_price,
                close_price,
                volume
            ])
            
            ohlc_data_by_item[item] = ohlc
    return ohlc_data_by_item

# Calculate OHLC data for 1-hour periods (change period_hours as needed)
ohlc_data_by_item = calculate_ohlc(trades_by_item )

# Save OHLC data to a new JSON file
with open("scripts/output/ohlc_data_4h.json", "w", encoding="utf-8") as file:
    json.dump(ohlc_data_by_item, file, indent=4)

print("OHLC data successfully written to ohlc_data.json")