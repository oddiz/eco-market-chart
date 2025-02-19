/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaClient } from "@prisma/client";
import fs from "fs";

type ohlcData = Record<
  string,
  {
    timestamp: string;
    quantity: number;
    price_per_item: number;
    total_price: number;
  }[]
>;
const ohlcData = JSON.parse(
  fs.readFileSync("./scripts/output/trades_by_item.json", "utf-8"),
) as ohlcData;
const prisma = new PrismaClient();

async function seed() {
  for (const [itemName, trades] of Object.entries(ohlcData)) {
    // Create or find the item
    const item = await prisma.item.upsert({
      where: { name: itemName },
      update: {},
      create: { name: itemName },
    });

    // Prepare trades for batch insert
    const tradeData = trades.map((trade) => ({
      time: new Date(trade.timestamp),
      price: trade.price_per_item,
      volume: trade.quantity,
      itemId: item.id,
    }));

    // Insert trades in batches
    await prisma.trade.createMany({
      data: tradeData,
    });

    console.log(
      `Inserted ${trades.length} trades for ${itemName} (item id: ${item.id})`,
    );
  }

  console.log("Database seeded successfully");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .finally(async () => {
    await prisma.$disconnect();
  });
