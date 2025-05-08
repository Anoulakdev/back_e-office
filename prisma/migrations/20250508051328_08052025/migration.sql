-- AlterTable
ALTER TABLE "DocDirector" ADD COLUMN     "docdt_fileoriginal" VARCHAR(255);

-- AlterTable
ALTER TABLE "DocExternal" ADD COLUMN     "docex_fileoriginal" VARCHAR(255);

-- AlterTable
ALTER TABLE "DocInternal" ADD COLUMN     "docin_fileoriginal" VARCHAR(255);

-- AlterTable
ALTER TABLE "DocdtLog" ADD COLUMN     "docdtlog_original" VARCHAR(255);

-- AlterTable
ALTER TABLE "DocdtTracking" ADD COLUMN     "docdtlog_original" VARCHAR(255);

-- AlterTable
ALTER TABLE "DocexLog" ADD COLUMN     "docexlog_original" VARCHAR(255);

-- AlterTable
ALTER TABLE "DocexTracking" ADD COLUMN     "docexlog_original" VARCHAR(255);

-- AlterTable
ALTER TABLE "DocinLog" ADD COLUMN     "docinlog_original" VARCHAR(255);

-- AlterTable
ALTER TABLE "DocinTracking" ADD COLUMN     "docinlog_original" VARCHAR(255);
