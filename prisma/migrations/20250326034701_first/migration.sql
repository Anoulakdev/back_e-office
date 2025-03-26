-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "emp_code" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'A',
    "gender" "Gender" NOT NULL,
    "tel" VARCHAR(255),
    "email" VARCHAR(255),
    "userimg" VARCHAR(255),
    "rankId" INTEGER,
    "roleId" INTEGER,
    "posId" INTEGER,
    "departmentId" INTEGER,
    "divisionId" INTEGER,
    "officeId" INTEGER,
    "unitId" INTEGER,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,
    "createdById" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rank" (
    "id" SERIAL NOT NULL,
    "rank_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "role_name" VARCHAR(255) NOT NULL,
    "role_code" VARCHAR(50),
    "role_description" TEXT,
    "authrole" VARCHAR(255),

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleMenu" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "title" VARCHAR(255),
    "path" VARCHAR(255),

    CONSTRAINT "RoleMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "rolemenuId" INTEGER NOT NULL,
    "C" BOOLEAN NOT NULL DEFAULT false,
    "R" BOOLEAN NOT NULL DEFAULT false,
    "U" BOOLEAN NOT NULL DEFAULT false,
    "D" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "department_name" VARCHAR(255),
    "department_code" VARCHAR(50),
    "department_status" VARCHAR(50) NOT NULL DEFAULT 'A',

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Division" (
    "id" SERIAL NOT NULL,
    "division_name" VARCHAR(255),
    "division_code" VARCHAR(50),
    "division_status" VARCHAR(50) NOT NULL DEFAULT 'A',
    "departmentId" INTEGER NOT NULL,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Office" (
    "id" SERIAL NOT NULL,
    "office_name" VARCHAR(255),
    "office_code" VARCHAR(50),
    "office_status" VARCHAR(50) NOT NULL DEFAULT 'A',
    "divisionId" INTEGER NOT NULL,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" SERIAL NOT NULL,
    "unit_name" VARCHAR(255),
    "unit_code" VARCHAR(50),
    "unit_status" VARCHAR(50) NOT NULL DEFAULT 'A',
    "unit_type" VARCHAR(50),
    "divisionId" INTEGER,
    "officeId" INTEGER,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionGroup" (
    "id" SERIAL NOT NULL,
    "pos_group_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "PositionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionCode" (
    "id" SERIAL NOT NULL,
    "pos_code_name" VARCHAR(255) NOT NULL,
    "pos_code_status" VARCHAR(50) NOT NULL DEFAULT 'A',
    "posgroupId" INTEGER NOT NULL,

    CONSTRAINT "PositionCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" SERIAL NOT NULL,
    "pos_name" VARCHAR(255) NOT NULL,
    "pos_status" VARCHAR(50) NOT NULL DEFAULT 'A',
    "poscodeId" INTEGER NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocExternal" (
    "id" SERIAL NOT NULL,
    "docex_no" VARCHAR(255) NOT NULL,
    "docex_date" TIMESTAMP(3),
    "docex_title" VARCHAR(255) NOT NULL,
    "docex_description" TEXT,
    "docex_file" VARCHAR(255) NOT NULL,
    "docex_filetype" VARCHAR(50) NOT NULL,
    "docex_filesize" INTEGER NOT NULL,
    "outsiderId" INTEGER,
    "assignto" INTEGER,
    "creatorCode" VARCHAR(255) NOT NULL,
    "priorityId" INTEGER,
    "doctypeId" INTEGER,
    "extype" INTEGER DEFAULT 1,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "DocExternal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocexTracking" (
    "id" SERIAL NOT NULL,
    "docexId" INTEGER NOT NULL,
    "assignerCode" VARCHAR(255),
    "receiverCode" VARCHAR(255),
    "docstatusId" INTEGER,
    "dateline" TIMESTAMP(3),
    "description" TEXT,
    "departmentactive" INTEGER,
    "divisionactive" INTEGER,
    "officeactive" INTEGER,
    "extype" INTEGER DEFAULT 1,
    "docexlog_file" VARCHAR(255),
    "docexlog_type" VARCHAR(255),
    "docexlog_size" INTEGER,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "DocexTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocexLog" (
    "id" SERIAL NOT NULL,
    "docexId" INTEGER NOT NULL,
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
    "extype" INTEGER DEFAULT 1,
    "docexlog_file" VARCHAR(255),
    "docexlog_type" VARCHAR(255),
    "docexlog_size" INTEGER,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "DocexLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocType" (
    "id" SERIAL NOT NULL,
    "doctype_name" VARCHAR(255) NOT NULL,
    "actionMax" INTEGER,
    "followMax" INTEGER,

    CONSTRAINT "DocType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Priority" (
    "id" SERIAL NOT NULL,
    "priority_name" VARCHAR(255) NOT NULL,
    "priority_code" VARCHAR(50),

    CONSTRAINT "Priority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocStatus" (
    "id" SERIAL NOT NULL,
    "docstatus_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "DocStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BelongTo" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),

    CONSTRAINT "BelongTo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outsider" (
    "id" SERIAL NOT NULL,
    "belongId" INTEGER,
    "name" VARCHAR(255),

    CONSTRAINT "Outsider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_emp_code_key" ON "User"("emp_code");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_posId_fkey" FOREIGN KEY ("posId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleMenu" ADD CONSTRAINT "RoleMenu_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_rolemenuId_fkey" FOREIGN KEY ("rolemenuId") REFERENCES "RoleMenu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Division" ADD CONSTRAINT "Division_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Office" ADD CONSTRAINT "Office_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionCode" ADD CONSTRAINT "PositionCode_posgroupId_fkey" FOREIGN KEY ("posgroupId") REFERENCES "PositionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_poscodeId_fkey" FOREIGN KEY ("poscodeId") REFERENCES "PositionCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocExternal" ADD CONSTRAINT "DocExternal_outsiderId_fkey" FOREIGN KEY ("outsiderId") REFERENCES "Outsider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocExternal" ADD CONSTRAINT "DocExternal_creatorCode_fkey" FOREIGN KEY ("creatorCode") REFERENCES "User"("emp_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocExternal" ADD CONSTRAINT "DocExternal_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "Priority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocExternal" ADD CONSTRAINT "DocExternal_doctypeId_fkey" FOREIGN KEY ("doctypeId") REFERENCES "DocType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexTracking" ADD CONSTRAINT "DocexTracking_docexId_fkey" FOREIGN KEY ("docexId") REFERENCES "DocExternal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexTracking" ADD CONSTRAINT "DocexTracking_assignerCode_fkey" FOREIGN KEY ("assignerCode") REFERENCES "User"("emp_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexTracking" ADD CONSTRAINT "DocexTracking_receiverCode_fkey" FOREIGN KEY ("receiverCode") REFERENCES "User"("emp_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexTracking" ADD CONSTRAINT "DocexTracking_docstatusId_fkey" FOREIGN KEY ("docstatusId") REFERENCES "DocStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexLog" ADD CONSTRAINT "DocexLog_docexId_fkey" FOREIGN KEY ("docexId") REFERENCES "DocExternal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexLog" ADD CONSTRAINT "DocexLog_assignerCode_fkey" FOREIGN KEY ("assignerCode") REFERENCES "User"("emp_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexLog" ADD CONSTRAINT "DocexLog_receiverCode_fkey" FOREIGN KEY ("receiverCode") REFERENCES "User"("emp_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexLog" ADD CONSTRAINT "DocexLog_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexLog" ADD CONSTRAINT "DocexLog_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexLog" ADD CONSTRAINT "DocexLog_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexLog" ADD CONSTRAINT "DocexLog_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexLog" ADD CONSTRAINT "DocexLog_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexLog" ADD CONSTRAINT "DocexLog_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexLog" ADD CONSTRAINT "DocexLog_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexLog" ADD CONSTRAINT "DocexLog_docstatusId_fkey" FOREIGN KEY ("docstatusId") REFERENCES "DocStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outsider" ADD CONSTRAINT "Outsider_belongId_fkey" FOREIGN KEY ("belongId") REFERENCES "BelongTo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
