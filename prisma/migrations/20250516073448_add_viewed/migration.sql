-- AlterTable
ALTER TABLE "DocdtLog" ADD COLUMN     "viewed" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "DocdtTracking" ADD COLUMN     "viewed" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "DocexLog" ADD COLUMN     "viewed" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "DocexTracking" ADD COLUMN     "viewed" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "DocinLog" ADD COLUMN     "viewed" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "DocinTracking" ADD COLUMN     "viewed" BOOLEAN DEFAULT false;
