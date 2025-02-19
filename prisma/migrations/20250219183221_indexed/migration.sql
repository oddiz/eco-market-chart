-- CreateIndex
CREATE INDEX "Item_name_idx" ON "Item"("name");

-- CreateIndex
CREATE INDEX "Trade_time_idx" ON "Trade"("time");

-- CreateIndex
CREATE INDEX "Trade_itemId_idx" ON "Trade"("itemId");
