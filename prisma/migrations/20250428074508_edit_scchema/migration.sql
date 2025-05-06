-- AlterTable
ALTER TABLE "Division" ADD COLUMN     "branch_id" INTEGER;

-- CreateTable
CREATE TABLE "DocInternal" (
    "id" SERIAL NOT NULL,
    "docin_no" VARCHAR(255) NOT NULL,
    "docin_date" TIMESTAMP(3),
    "docin_title" VARCHAR(255) NOT NULL,
    "docin_description" TEXT,
    "docin_file" VARCHAR(255) NOT NULL,
    "docin_filetype" VARCHAR(50) NOT NULL,
    "docin_filesize" INTEGER NOT NULL,
    "assignto" INTEGER,
    "creatorCode" VARCHAR(255) NOT NULL,
    "priorityId" INTEGER,
    "doctypeId" INTEGER,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "DocInternal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocinTracking" (
    "id" SERIAL NOT NULL,
    "docinId" INTEGER NOT NULL,
    "assignerCode" VARCHAR(255),
    "receiverCode" VARCHAR(255),
    "docstatusId" INTEGER,
    "dateline" TIMESTAMP(3),
    "description" TEXT,
    "docexlog_file" VARCHAR(255),
    "docexlog_type" VARCHAR(255),
    "docexlog_size" INTEGER,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "DocinTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocinLog" (
    "id" SERIAL NOT NULL,
    "docinId" INTEGER NOT NULL,
    "assignerCode" VARCHAR(255),
    "receiverCode" VARCHAR(255),
    "rankId" INTEGER,
    "roleId" INTEGER,
    "positionId" INTEGER,
    "departmentId" INTEGER,
    "divisionId" INTEGER,
    "officeId" INTEGER,
    "unitId" INTEGER,
    "docstatusId" INTEGER,
    "dateline" TIMESTAMP(3),
    "description" TEXT,
    "direction" VARCHAR(255),
    "docexlog_file" VARCHAR(255),
    "docexlog_type" VARCHAR(255),
    "docexlog_size" INTEGER,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "DocinLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DocInternal" ADD CONSTRAINT "DocInternal_creatorCode_fkey" FOREIGN KEY ("creatorCode") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocInternal" ADD CONSTRAINT "DocInternal_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "Priority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocInternal" ADD CONSTRAINT "DocInternal_doctypeId_fkey" FOREIGN KEY ("doctypeId") REFERENCES "DocType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocinTracking" ADD CONSTRAINT "DocinTracking_docinId_fkey" FOREIGN KEY ("docinId") REFERENCES "DocInternal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocinTracking" ADD CONSTRAINT "DocinTracking_assignerCode_fkey" FOREIGN KEY ("assignerCode") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocinTracking" ADD CONSTRAINT "DocinTracking_receiverCode_fkey" FOREIGN KEY ("receiverCode") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocinTracking" ADD CONSTRAINT "DocinTracking_docstatusId_fkey" FOREIGN KEY ("docstatusId") REFERENCES "DocStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocinLog" ADD CONSTRAINT "DocinLog_docinId_fkey" FOREIGN KEY ("docinId") REFERENCES "DocInternal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocinLog" ADD CONSTRAINT "DocinLog_assignerCode_fkey" FOREIGN KEY ("assignerCode") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocinLog" ADD CONSTRAINT "DocinLog_receiverCode_fkey" FOREIGN KEY ("receiverCode") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocinLog" ADD CONSTRAINT "DocinLog_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocinLog" ADD CONSTRAINT "DocinLog_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocinLog" ADD CONSTRAINT "DocinLog_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocinLog" ADD CONSTRAINT "DocinLog_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocinLog" ADD CONSTRAINT "DocinLog_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocinLog" ADD CONSTRAINT "DocinLog_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocinLog" ADD CONSTRAINT "DocinLog_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocinLog" ADD CONSTRAINT "DocinLog_docstatusId_fkey" FOREIGN KEY ("docstatusId") REFERENCES "DocStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
