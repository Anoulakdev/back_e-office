-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "emp_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'A',
    "gender" TEXT,
    "role_id" INTEGER,
    "pos_id" INTEGER,
    "department_id" INTEGER,
    "division_id" INTEGER,
    "office_id" INTEGER,
    "unit_id" INTEGER,
    "tel" TEXT,
    "telapp" TEXT,
    "email" TEXT,
    "user_image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Role" (
    "role_id" SERIAL NOT NULL,
    "role_name" TEXT NOT NULL,
    "role_code" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "permission_id" SERIAL NOT NULL,
    "permission_name" TEXT NOT NULL,
    "permission_code" TEXT,
    "permission_description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "Department" (
    "department_id" SERIAL NOT NULL,
    "department_name" TEXT,
    "department_code" TEXT,
    "department_status" TEXT NOT NULL DEFAULT 'A',

    CONSTRAINT "Department_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "Division" (
    "division_id" SERIAL NOT NULL,
    "division_name" TEXT,
    "division_code" TEXT,
    "division_status" TEXT NOT NULL DEFAULT 'A',
    "department_id" INTEGER NOT NULL,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("division_id")
);

-- CreateTable
CREATE TABLE "Office" (
    "office_id" SERIAL NOT NULL,
    "office_name" TEXT,
    "office_code" TEXT,
    "office_status" TEXT NOT NULL DEFAULT 'A',
    "division_id" INTEGER NOT NULL,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("office_id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "unit_id" SERIAL NOT NULL,
    "unit_name" TEXT,
    "unit_code" TEXT,
    "unit_status" TEXT NOT NULL DEFAULT 'A',
    "unit_type" TEXT,
    "division_id" INTEGER,
    "office_id" INTEGER,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("unit_id")
);

-- CreateTable
CREATE TABLE "PositionGroup" (
    "pos_group_id" SERIAL NOT NULL,
    "pos_group_name" TEXT NOT NULL,

    CONSTRAINT "PositionGroup_pkey" PRIMARY KEY ("pos_group_id")
);

-- CreateTable
CREATE TABLE "PositionCode" (
    "pos_code_id" SERIAL NOT NULL,
    "pos_code_name" TEXT NOT NULL,
    "pos_code_status" TEXT NOT NULL DEFAULT 'A',
    "pos_group_id" INTEGER NOT NULL,

    CONSTRAINT "PositionCode_pkey" PRIMARY KEY ("pos_code_id")
);

-- CreateTable
CREATE TABLE "Position" (
    "pos_id" SERIAL NOT NULL,
    "pos_name" TEXT NOT NULL,
    "pos_status" TEXT NOT NULL DEFAULT 'A',
    "pos_code_id" INTEGER NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("pos_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_emp_code_key" ON "User"("emp_code");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("role_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_pos_id_fkey" FOREIGN KEY ("pos_id") REFERENCES "Position"("pos_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("department_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "Division"("division_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "Office"("office_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "Unit"("unit_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "Permission"("permission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Division" ADD CONSTRAINT "Division_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Office" ADD CONSTRAINT "Office_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "Division"("division_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "Division"("division_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "Office"("office_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionCode" ADD CONSTRAINT "PositionCode_pos_group_id_fkey" FOREIGN KEY ("pos_group_id") REFERENCES "PositionGroup"("pos_group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_pos_code_id_fkey" FOREIGN KEY ("pos_code_id") REFERENCES "PositionCode"("pos_code_id") ON DELETE RESTRICT ON UPDATE CASCADE;
