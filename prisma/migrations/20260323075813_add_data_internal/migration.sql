-- AlterTable
ALTER TABLE "DocinLog" ADD COLUMN     "departmentactive" INTEGER,
ADD COLUMN     "divisionactive" INTEGER,
ADD COLUMN     "officeactive" INTEGER;

-- AlterTable
ALTER TABLE "DocinTracking" ADD COLUMN     "departmentactive" INTEGER,
ADD COLUMN     "divisionactive" INTEGER,
ADD COLUMN     "officeactive" INTEGER;
