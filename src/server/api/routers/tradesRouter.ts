import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";

export const tradesRouter = createTRPCRouter({
  getOhlcData: publicProcedure
    .input(
      z.object({
        itemName: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { itemName, startDate, endDate } = input;

      const where = {
        item: itemName ? { name: itemName } : undefined,
        time: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      };

      const trades = await db.trade.findMany({
        where,
        orderBy: { time: "asc" },
        select: {
          id: true,
          itemId: true,
          time: true,
          price: true,
          volume: true,
        },
      });

      return trades;
    }),
  getItems: publicProcedure.query(async () => {
    const items = await db.item.findMany({
      select: { name: true },
    });

    const itemNames = items.map((item) => item.name);
    return itemNames;
  }),
});
