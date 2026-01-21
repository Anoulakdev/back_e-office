const fs = require("fs");
const prisma = require("../../../prisma/prisma");
const multer = require("multer");
const path = require("path");
const moment = require("moment-timezone");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/documentlog");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }).single("docexlog_file");

module.exports = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({
        message: "Multer error occurred during upload.",
        error: err,
      });
    } else if (err) {
      return res.status(500).json({
        message: "Unknown error occurred during upload.",
        error: err,
      });
    }

    try {
      const { docexlogId } = req.params;

      // Step 1: Find the document to update
      const docexlog = await prisma.docexLog.findUnique({
        where: {
          id: Number(docexlogId),
        },
      });

      if (!docexlog) {
        return res.status(404).json({ message: "Documentlog not found" });
      }

      // Step 3: If a new file is uploaded, delete the old file if it exists
      let docexfileoriginal = docexlog.docexlog_original;
      let docexfile = docexlog.docexlog_file;
      let docextype = docexlog.docexlog_type;
      let docexsize = docexlog.docexlog_size;
      if (req.file) {
        if (docexlog.docexlog_file) {
          const oldfiledocPath = path.join(
            __dirname,
            "../../../uploads/documentlog", // Assuming the file is stored here
            path.basename(docexlog.docexlog_file),
          );
          fs.unlink(oldfiledocPath, (err) => {
            if (err) {
              console.error("Error deleting old file: ", err);
            }
          });
        }

        docexfileoriginal = Buffer.from(
          req.file.originalname,
          "latin1",
        ).toString("utf8");
        docexfile = req.file.filename;
        docextype = req.file.mimetype;
        docexsize = req.file.size;
      }

      // Step 4: Update the docexLog record
      const updated = await prisma.docexLog.update({
        where: {
          id: Number(docexlogId),
        },
        data: {
          docexlog_original: docexfileoriginal,
          docexlog_file: docexfile,
          docexlog_type: docextype,
          docexlog_size: docexsize,
        },
      });

      res.json({ message: "Update successful!", data: updated });
    } catch (err) {
      console.log(err); // Added logging for better error debugging
      res.status(500).json({ message: "Server Error", error: err.message });
    }
  });
};
