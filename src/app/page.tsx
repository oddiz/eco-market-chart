"use client";
import RangeSlider from "@/app/_components/DateSlider";
import { SearchItemInput } from "@/app/_components/SearchInput";
import { CandlestickChart } from "@/app/_components/TVChart";
import { useState } from "react";

export default function Home() {
  const [activeItem, setActiveItem] = useState("");
  const [dateRange, setDateRange] = useState<number[]>([
    1640984400000, 1739988675876,
  ]);

  const handleDateChange = (
    event: Event | React.SyntheticEvent,
    newValue: number | number[],
  ) => {
    setDateRange(newValue as number[]);
  };

  const handleItemChange = (value: string) => {
    setActiveItem(value);
  };

  if (dateRange[0] && dateRange[1]) {
    return (
      <main className="dark flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
        <div className="absolute left-4 top-4 z-50 flex h-48 flex-col rounded-lg bg-gray-900 p-4">
          <RangeSlider
            dateMax={1739988675876}
            handleDateChange={handleDateChange}
          />
          <SearchItemInput handleItemChange={handleItemChange} />
        </div>
        <CandlestickChart
          startDate={new Date(dateRange[0])}
          endDate={new Date(dateRange[1])}
          title={activeItem}
        />
      </main>
    );
  }
}
