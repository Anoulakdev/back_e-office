-- AlterTable
ALTER TABLE "DocExport" ADD COLUMN     "export_file" VARCHAR(255),
ADD COLUMN     "export_fileoriginal" VARCHAR(255),
ADD COLUMN     "export_filesize" INTEGER,
ADD COLUMN     "export_filetype" VARCHAR(50);
