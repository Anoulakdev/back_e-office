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

const upload = multer({ storage: storage }).single("docdtlog_file");

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
      const { docdtlogId } = req.params;

      const { description } = req.body;

      // Step 1: Find the document to update
      const docdtlog = await prisma.docdtLog.findUnique({
        where: {
          id: Number(docdtlogId),
        },
      });

      if (!docdtlog) {
        return res.status(404).json({ message: "Documentlog not found" });
      }

      // Step 3: If a new file is uploaded, delete the old file if it exists
      let docdtlogoriginal = docdtlog.docdtlog_original;
      let docdtlogfile = docdtlog.docdtlog_file;
      let docdtlogtype = docdtlog.docdtlog_type;
      let docdtlogsize = docdtlog.docdtlog_size;
      if (req.file) {
        if (docdtlog.docdtlog_file) {
          const oldfiledocPath = path.join(
            __dirname,
            "../../../uploads/documentlog", // Assuming the file is stored here
            path.basename(docdtlog.docdtlog_file),
          );
          fs.unlink(oldfiledocPath, (err) => {
            if (err) {
              console.error("Error deleting old file: ", err);
            }
          });
        }

        docdtlogoriginal = Buffer.from(
          req.file.originalname,
          "latin1",
        ).toString("utf8");
        docdtlogfile = req.file.filename;
        docdtlogtype = req.file.mimetype;
        docdtlogsize = req.file.size;
      }

      // Step 4: Update the docdtLog record
      const updated = await prisma.docdtLog.update({
        where: {
          id: Number(docdtlogId),
        },
        data: {
          description: description,
          docdtlog_original: docdtlogoriginal,
          docdtlog_file: docdtlogfile,
          docdtlog_type: docdtlogtype,
          docdtlog_size: docdtlogsize,
        },
      });

      res.json({ message: "Update successful!", data: updated });
    } catch (err) {
      console.log(err); // Added logging for better error debugging
      res.status(500).json({ message: "Server Error", error: err.message });
    }
  });
};
