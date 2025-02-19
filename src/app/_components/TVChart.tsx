"use client";

import processTrades from "@/app/_utils/convertToTVData";
import { api } from "@/trpc/react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  type CandlestickData,
  type WhitespaceData,
  HistogramSeries,
  type HistogramData,
  LineStyle,
} from "lightweight-charts";
import React, { useEffect, useRef } from "react";

interface ChartComponentProps {
  title: string;
  data: CandlestickData[] | WhitespaceData[];
  volumeData?: HistogramData[];
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
    borderColor?: string;
  };
}

export const ChartComponent = (props: ChartComponentProps) => {
  const {
    title,
    data,
    volumeData,
    colors: {
      backgroundColor = "#222",
      lineColor = "#444",
      textColor = "#C3BCDB",
      areaTopColor = "#26a69a",
      areaBottomColor = "#ef5350",
    } = {},
  } = props;

  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },

        textColor,
      },
      crosshair: {
        // hide the horizontal crosshair line
        // Horizontal crosshair line (showing Price in Label)
        horzLine: {
          color: "#9B7DFF",
          labelBackgroundColor: "#9B7DFF",
        },
        // hide the vertical crosshair label
        vertLine: {
          style: LineStyle.Solid,
          labelBackgroundColor: "#9B7DFF",
        },
      },

      grid: {
        vertLines: {
          color: lineColor,
        },
        horzLines: {
          color: lineColor,
        },
      },
    });

    chart.timeScale().applyOptions({
      barSpacing: 20,
    });
    chart.timeScale().fitContent();

    const newSeries = chart.addSeries(CandlestickSeries, {
      upColor: areaTopColor,
      downColor: areaBottomColor,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      borderColor: "#71649C",
    });
    newSeries.setData(data);
    newSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.1, // highest point of the series will be 70% away from the top
        bottom: 0.25,
      },
    });

    // VOLUME SERIES

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#484848",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "", // set as an overlay by setting a blank priceScaleId
      // set the positioning of the volume series
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8, // highest point of the series will be 80% away from the top
        bottom: 0,
      },
    });
    if (volumeData) {
      volumeSeries.setData(volumeData);
    }

    const handleResize = () => {
      const mainEle = chartContainerRef.current?.parentElement;
      if (!mainEle) return;
      chart.applyOptions({
        width: mainEle.clientWidth,
        height: mainEle.clientHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);

      chart.remove();
    };
  }, [
    title,
    data,
    volumeData,
    backgroundColor,
    lineColor,
    textColor,
    areaTopColor,
    areaBottomColor,
  ]);

  return <div ref={chartContainerRef} />;
};

export function CandlestickChart(
  props: React.JSX.IntrinsicAttributes & {
    title: string;
    startDate: Date;
    endDate: Date;
  },
) {
  const { title, endDate, startDate } = props;
  const { data: ohlcData } = api.trades.getOhlcData.useQuery({
    itemName: title,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  // convert unix date into format=yyyy-mm-dd

  if (ohlcData) {
    const { ohlc, volumeData } = processTrades(ohlcData);
    return (
      <ChartComponent
        {...props}
        title={title}
        data={ohlc}
        volumeData={volumeData}
      ></ChartComponent>
    );
  }
}
