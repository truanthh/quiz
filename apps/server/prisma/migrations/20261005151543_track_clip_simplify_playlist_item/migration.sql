/*
  Warnings:

  - You are about to drop the column `clipEndMs` on the `PlaylistItem` table. All the data in the column will be lost.
  - You are about to drop the column `clipStartMs` on the `PlaylistItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlaylistItem" DROP COLUMN "clipEndMs",
DROP COLUMN "clipStartMs";

-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "clipStartMs" INTEGER NOT NULL DEFAULT 0;
