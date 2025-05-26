-- CreateTable
CREATE TABLE "DocExport" (
    "id" SERIAL NOT NULL,
    "docexId" INTEGER NOT NULL,
    "export_no" VARCHAR(255),
    "export_title" VARCHAR(255),
    "export_description" TEXT,
    "signatoryCode" VARCHAR(255),
    "export_status" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "DocExport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DocExport" ADD CONSTRAINT "DocExport_docexId_fkey" FOREIGN KEY ("docexId") REFERENCES "DocExternal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocExport" ADD CONSTRAINT "DocExport_signatoryCode_fkey" FOREIGN KEY ("signatoryCode") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;
