-- AlterTable
ALTER TABLE "DocdtLog" ADD COLUMN     "subunitId" INTEGER;

-- AlterTable
ALTER TABLE "DocexLog" ADD COLUMN     "subunitId" INTEGER;

-- AlterTable
ALTER TABLE "DocinLog" ADD COLUMN     "subunitId" INTEGER;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "subunitId" INTEGER;

-- CreateTable
CREATE TABLE "Subunit" (
    "id" SERIAL NOT NULL,
    "sub_unit_name" VARCHAR(255),
    "sub_unit_code" VARCHAR(50),
    "divisionId" INTEGER,
    "officeId" INTEGER,

    CONSTRAINT "Subunit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Subunit_divisionId_idx" ON "Subunit"("divisionId");

-- CreateIndex
CREATE INDEX "Subunit_officeId_idx" ON "Subunit"("officeId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_subunitId_fkey" FOREIGN KEY ("subunitId") REFERENCES "Subunit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subunit" ADD CONSTRAINT "Subunit_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subunit" ADD CONSTRAINT "Subunit_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexLog" ADD CONSTRAINT "DocexLog_subunitId_fkey" FOREIGN KEY ("subunitId") REFERENCES "Subunit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocinLog" ADD CONSTRAINT "DocinLog_subunitId_fkey" FOREIGN KEY ("subunitId") REFERENCES "Subunit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocdtLog" ADD CONSTRAINT "DocdtLog_subunitId_fkey" FOREIGN KEY ("subunitId") REFERENCES "Subunit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
