/*
  Warnings:

  - Added the required column `priority_code` to the `Priority` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Priority" ADD COLUMN     "priority_code" TEXT NOT NULL;