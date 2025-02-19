"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";

function valuetext(value: number) {
  return `${new Date(value).toLocaleDateString()}`;
}

export default function RangeSlider({
  handleDateChange,
}: {
  handleDateChange: (
    event: Event | React.SyntheticEvent,
    newValue: number | number[],
  ) => void;
  dateMax: number;
}) {
  const [value, setValue] = React.useState<number[]>([
    1640984400000, 1739988675876,
  ]);

  const handleChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number[]);
  };

  return (
    <Box className="flex flex-col" sx={{ width: 300 }}>
      <h2>Date range:</h2>
      <Slider
        min={1640984400000}
        max={1739988675876}
        value={value}
        onChange={handleChange}
        onChangeCommitted={handleDateChange}
        valueLabelDisplay="auto"
        valueLabelFormat={valuetext}
      />
      <span>From: {new Date(value[0]!).toLocaleDateString()}</span>
      <span>To: {new Date(value[1]!).toLocaleDateString()}</span>
    </Box>
  );
}
