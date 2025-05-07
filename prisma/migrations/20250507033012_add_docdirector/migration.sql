-- CreateTable
CREATE TABLE "DocDirector" (
    "id" SERIAL NOT NULL,
    "docdt_no" VARCHAR(255) NOT NULL,
    "docdt_date" TIMESTAMP(3),
    "docdt_title" VARCHAR(255) NOT NULL,
    "docdt_description" TEXT,
    "docdt_file" VARCHAR(255) NOT NULL,
    "docdt_filetype" VARCHAR(50) NOT NULL,
    "docdt_filesize" INTEGER NOT NULL,
    "assignto" INTEGER,
    "creatorCode" VARCHAR(255) NOT NULL,
    "priorityId" INTEGER,
    "doctypeId" INTEGER,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "DocDirector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocdtTracking" (
    "id" SERIAL NOT NULL,
    "docdtId" INTEGER NOT NULL,
    "assignerCode" VARCHAR(255),
    "receiverCode" VARCHAR(255),
    "docstatusId" INTEGER,
    "dateline" TIMESTAMP(3),
    "description" TEXT,
    "departmentactive" INTEGER,
    "divisionactive" INTEGER,
    "officeactive" INTEGER,
    "docexlog_file" VARCHAR(255),
    "docexlog_type" VARCHAR(255),
    "docexlog_size" INTEGER,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "DocdtTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocdtLog" (
    "id" SERIAL NOT NULL,
    "docdtId" INTEGER NOT NULL,
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
    "departmentactive" INTEGER,
    "divisionactive" INTEGER,
    "officeactive" INTEGER,
    "docexlog_file" VARCHAR(255),
    "docexlog_type" VARCHAR(255),
    "docexlog_size" INTEGER,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "DocdtLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DocDirector" ADD CONSTRAINT "DocDirector_creatorCode_fkey" FOREIGN KEY ("creatorCode") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocDirector" ADD CONSTRAINT "DocDirector_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "Priority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocDirector" ADD CONSTRAINT "DocDirector_doctypeId_fkey" FOREIGN KEY ("doctypeId") REFERENCES "DocType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocdtTracking" ADD CONSTRAINT "DocdtTracking_docdtId_fkey" FOREIGN KEY ("docdtId") REFERENCES "DocDirector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocdtTracking" ADD CONSTRAINT "DocdtTracking_assignerCode_fkey" FOREIGN KEY ("assignerCode") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocdtTracking" ADD CONSTRAINT "DocdtTracking_receiverCode_fkey" FOREIGN KEY ("receiverCode") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocdtTracking" ADD CONSTRAINT "DocdtTracking_docstatusId_fkey" FOREIGN KEY ("docstatusId") REFERENCES "DocStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocdtLog" ADD CONSTRAINT "DocdtLog_docdtId_fkey" FOREIGN KEY ("docdtId") REFERENCES "DocDirector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocdtLog" ADD CONSTRAINT "DocdtLog_assignerCode_fkey" FOREIGN KEY ("assignerCode") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocdtLog" ADD CONSTRAINT "DocdtLog_receiverCode_fkey" FOREIGN KEY ("receiverCode") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocdtLog" ADD CONSTRAINT "DocdtLog_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocdtLog" ADD CONSTRAINT "DocdtLog_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocdtLog" ADD CONSTRAINT "DocdtLog_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocdtLog" ADD CONSTRAINT "DocdtLog_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocdtLog" ADD CONSTRAINT "DocdtLog_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocdtLog" ADD CONSTRAINT "DocdtLog_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocdtLog" ADD CONSTRAINT "DocdtLog_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocdtLog" ADD CONSTRAINT "DocdtLog_docstatusId_fkey" FOREIGN KEY ("docstatusId") REFERENCES "DocStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
