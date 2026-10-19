-- AlterTable
ALTER TABLE "DocDirector" ADD COLUMN     "closureStatusId" INTEGER;

-- AlterTable
ALTER TABLE "DocExternal" ADD COLUMN     "closureStatusId" INTEGER;

-- AlterTable
ALTER TABLE "DocInternal" ADD COLUMN     "closureStatusId" INTEGER;

-- CreateTable
CREATE TABLE "ClosureStatus" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "ClosureStatus_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DocExternal" ADD CONSTRAINT "DocExternal_closureStatusId_fkey" FOREIGN KEY ("closureStatusId") REFERENCES "ClosureStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocInternal" ADD CONSTRAINT "DocInternal_closureStatusId_fkey" FOREIGN KEY ("closureStatusId") REFERENCES "ClosureStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocDirector" ADD CONSTRAINT "DocDirector_closureStatusId_fkey" FOREIGN KEY ("closureStatusId") REFERENCES "ClosureStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
