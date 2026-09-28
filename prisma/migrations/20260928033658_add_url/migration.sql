-- AlterTable
ALTER TABLE "DocdtLog" ADD COLUMN     "docdtlog_url" TEXT;

-- AlterTable
ALTER TABLE "DocdtTracking" ADD COLUMN     "docdtlog_url" TEXT;

-- AlterTable
ALTER TABLE "DocexLog" ADD COLUMN     "docexlog_url" TEXT;

-- AlterTable
ALTER TABLE "DocexTracking" ADD COLUMN     "docexlog_url" TEXT;

-- AlterTable
ALTER TABLE "DocinLog" ADD COLUMN     "docinlog_url" TEXT;

-- AlterTable
ALTER TABLE "DocinTracking" ADD COLUMN     "docinlog_url" TEXT;
