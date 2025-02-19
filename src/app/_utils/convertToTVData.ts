import type { Trade } from "@prisma/client";
import type { Time } from "lightweight-charts";

interface OHLCData {
  time: Time;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}
export default function processTrades(trades: Trade[]): {
  ohlc: OHLCData[];
  volumeData: { time: Time; value: number }[];
} {
  if (!trades || trades.length === 0) {
    return { ohlc: [], volumeData: [] };
  }

  // Parse timestamps and group trades into 4-hour intervals
  const parsedTrades: { intervalStart: Date; trade: Trade }[] = trades.map(
    (trade) => {
      const dt = new Date(trade.time);
      const intervalStartHour = Math.floor(dt.getUTCHours() / 4) * 4;
      const intervalStart = new Date(dt);
      intervalStart.setUTCHours(intervalStartHour, 0, 0, 0);
      return { intervalStart, trade };
    },
  );

  // Sort trades by interval start time
  parsedTrades.sort(
    (a, b) => a.intervalStart.getTime() - b.intervalStart.getTime(),
  );

  // Group trades by interval
  const groups = new Map<string, Trade[]>();
  for (const { intervalStart, trade } of parsedTrades) {
    const key = intervalStart.toISOString();
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(trade);
  }

  // Get all unique dates in the data
  const dates = new Set<string>();
  for (const { intervalStart } of parsedTrades) {
    dates.add(intervalStart.toISOString().split("T")[0]!);
  }

  const minDate = new Date(
    Math.min(...Array.from(dates).map((date) => new Date(date).getTime())),
  );
  const maxDate = new Date(
    Math.max(...Array.from(dates).map((date) => new Date(date).getTime())),
  );

  // Generate all 4-hour intervals between minDate and maxDate
  const allIntervals: Date[] = [];
  const currentDate = new Date(minDate);
  while (currentDate <= maxDate) {
    for (const hour of [0, 4, 8, 12, 16, 20]) {
      const intervalStart = new Date(currentDate);
      intervalStart.setUTCHours(hour, 0, 0, 0);
      allIntervals.push(intervalStart);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Sort intervals
  allIntervals.sort((a, b) => a.getTime() - b.getTime());

  // Calculate OHLC and volume for each interval
  const ohlc: OHLCData[] = [];
  const volumeData = [];

  for (const intervalStart of allIntervals) {
    const key = intervalStart.toISOString();
    const tradesInInterval = groups.get(key) ?? [];

    if (tradesInInterval.length > 0) {
      const sortedTrades = tradesInInterval.sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
      );
      const prices = sortedTrades.map((t) => t.price);
      const quantities = sortedTrades.map((t) => t.volume);

      const open = prices[0];
      const high = Math.max(...prices);
      const low = Math.min(...prices);
      const close = prices[prices.length - 1];
      const volume = quantities.reduce((sum, q) => sum + q, 0);

      ohlc.push({
        time: (intervalStart.getTime() / 1000) as Time,
        open,
        high,
        low,
        close,
        volume,
      });
      volumeData.push({
        time: (intervalStart.getTime() / 1000) as Time,
        value: volume,
      });
    } else {
      ohlc.push({
        time: (intervalStart.getTime() / 1000) as Time,
      });
      volumeData.push({
        time: (intervalStart.getTime() / 1000) as Time,
        value: 0,
      });
    }
  }
  return { ohlc, volumeData };
}
