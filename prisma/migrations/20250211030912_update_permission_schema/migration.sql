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

-- AddForeignKey
ALTER TABLE "RoleMenu" ADD CONSTRAINT "RoleMenu_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_rolemenuId_fkey" FOREIGN KEY ("rolemenuId") REFERENCES "RoleMenu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
