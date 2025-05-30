-- AlterTable
ALTER TABLE "DocDirector" ALTER COLUMN "docdt_title" DROP NOT NULL,
ALTER COLUMN "docdt_file" DROP NOT NULL,
ALTER COLUMN "docdt_filetype" DROP NOT NULL,
ALTER COLUMN "docdt_filesize" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DocExternal" ALTER COLUMN "docex_title" DROP NOT NULL,
ALTER COLUMN "docex_file" DROP NOT NULL,
ALTER COLUMN "docex_filetype" DROP NOT NULL,
ALTER COLUMN "docex_filesize" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DocInternal" ALTER COLUMN "docin_title" DROP NOT NULL,
ALTER COLUMN "docin_file" DROP NOT NULL,
ALTER COLUMN "docin_filetype" DROP NOT NULL,
ALTER COLUMN "docin_filesize" DROP NOT NULL;
