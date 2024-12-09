-- AlterTable
ALTER TABLE "User" ADD COLUMN     "rank_id" INTEGER;

-- CreateTable
CREATE TABLE "Rank" (
    "rank_id" SERIAL NOT NULL,
    "rank_name" TEXT NOT NULL,

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("rank_id")
);

-- CreateTable
CREATE TABLE "DocExternal" (
    "docex_id" SERIAL NOT NULL,
    "docex_no" TEXT NOT NULL,
    "datedocument" TIMESTAMP(3),
    "dateline" TIMESTAMP(3),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "docex_file" TEXT NOT NULL,
    "outsider" TEXT NOT NULL,
    "creatorCode" TEXT NOT NULL,
    "directorCode" TEXT,
    "role_id" INTEGER,
    "rank_id" INTEGER,
    "priority_id" INTEGER,
    "doctype_id" INTEGER,
    "docstatus_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocExternal_pkey" PRIMARY KEY ("docex_id")
);

-- CreateTable
CREATE TABLE "DocexFile" (
    "docex_file_id" SERIAL NOT NULL,
    "docex_id" INTEGER NOT NULL,
    "docex_file_name" TEXT NOT NULL,
    "docex_file_size" TEXT NOT NULL,
    "docex_file_type" TEXT,

    CONSTRAINT "DocexFile_pkey" PRIMARY KEY ("docex_file_id")
);

-- CreateTable
CREATE TABLE "DocexTask" (
    "docex_task_id" SERIAL NOT NULL,
    "docex_id" INTEGER NOT NULL,
    "assignerCode" TEXT NOT NULL,
    "receiverCode" TEXT,
    "role_id" INTEGER,
    "department_id" INTEGER NOT NULL,
    "division_id" INTEGER,
    "office_id" INTEGER,
    "unit_id" INTEGER,
    "rank_id" INTEGER DEFAULT 1,
    "active" INTEGER DEFAULT 1,
    "comments" TEXT,
    "docstatus_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocexTask_pkey" PRIMARY KEY ("docex_task_id")
);

-- CreateTable
CREATE TABLE "DocType" (
    "doctype_id" SERIAL NOT NULL,
    "doctype_name" TEXT NOT NULL,

    CONSTRAINT "DocType_pkey" PRIMARY KEY ("doctype_id")
);

-- CreateTable
CREATE TABLE "Priority" (
    "priority_id" SERIAL NOT NULL,
    "priority_name" TEXT NOT NULL,

    CONSTRAINT "Priority_pkey" PRIMARY KEY ("priority_id")
);

-- CreateTable
CREATE TABLE "DocStatus" (
    "docstatus_id" SERIAL NOT NULL,
    "docstatus_name" TEXT NOT NULL,

    CONSTRAINT "DocStatus_pkey" PRIMARY KEY ("docstatus_id")
);

-- CreateIndex
CREATE INDEX "DocexFile_docex_id_idx" ON "DocexFile"("docex_id");

-- CreateIndex
CREATE INDEX "DocexTask_docex_id_idx" ON "DocexTask"("docex_id");

-- CreateIndex
CREATE INDEX "DocexTask_assignerCode_idx" ON "DocexTask"("assignerCode");

-- CreateIndex
CREATE INDEX "DocexTask_receiverCode_idx" ON "DocexTask"("receiverCode");

-- CreateIndex
CREATE INDEX "User_emp_code_idx" ON "User"("emp_code");

-- CreateIndex
CREATE INDEX "User_department_id_idx" ON "User"("department_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_rank_id_fkey" FOREIGN KEY ("rank_id") REFERENCES "Rank"("rank_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocExternal" ADD CONSTRAINT "DocExternal_creatorCode_fkey" FOREIGN KEY ("creatorCode") REFERENCES "User"("emp_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocExternal" ADD CONSTRAINT "DocExternal_directorCode_fkey" FOREIGN KEY ("directorCode") REFERENCES "User"("emp_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocExternal" ADD CONSTRAINT "DocExternal_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("role_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocExternal" ADD CONSTRAINT "DocExternal_rank_id_fkey" FOREIGN KEY ("rank_id") REFERENCES "Rank"("rank_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocExternal" ADD CONSTRAINT "DocExternal_priority_id_fkey" FOREIGN KEY ("priority_id") REFERENCES "Priority"("priority_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocExternal" ADD CONSTRAINT "DocExternal_doctype_id_fkey" FOREIGN KEY ("doctype_id") REFERENCES "DocType"("doctype_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocExternal" ADD CONSTRAINT "DocExternal_docstatus_id_fkey" FOREIGN KEY ("docstatus_id") REFERENCES "DocStatus"("docstatus_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexFile" ADD CONSTRAINT "DocexFile_docex_id_fkey" FOREIGN KEY ("docex_id") REFERENCES "DocExternal"("docex_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexTask" ADD CONSTRAINT "DocexTask_docex_id_fkey" FOREIGN KEY ("docex_id") REFERENCES "DocExternal"("docex_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexTask" ADD CONSTRAINT "DocexTask_assignerCode_fkey" FOREIGN KEY ("assignerCode") REFERENCES "User"("emp_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexTask" ADD CONSTRAINT "DocexTask_receiverCode_fkey" FOREIGN KEY ("receiverCode") REFERENCES "User"("emp_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexTask" ADD CONSTRAINT "DocexTask_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("role_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexTask" ADD CONSTRAINT "DocexTask_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexTask" ADD CONSTRAINT "DocexTask_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "Division"("division_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexTask" ADD CONSTRAINT "DocexTask_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "Office"("office_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexTask" ADD CONSTRAINT "DocexTask_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "Unit"("unit_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexTask" ADD CONSTRAINT "DocexTask_rank_id_fkey" FOREIGN KEY ("rank_id") REFERENCES "Rank"("rank_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexTask" ADD CONSTRAINT "DocexTask_docstatus_id_fkey" FOREIGN KEY ("docstatus_id") REFERENCES "DocStatus"("docstatus_id") ON DELETE SET NULL ON UPDATE CASCADE;
