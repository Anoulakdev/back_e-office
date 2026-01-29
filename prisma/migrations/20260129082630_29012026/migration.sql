-- DropForeignKey
ALTER TABLE "public"."Office" DROP CONSTRAINT "Office_divisionId_fkey";

-- AlterTable
ALTER TABLE "Office" ALTER COLUMN "divisionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Office" ADD CONSTRAINT "Office_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
