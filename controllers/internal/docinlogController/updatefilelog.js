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

const upload = multer({ storage: storage }).single("docinlog_file");

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
      const { docinlogId } = req.params;

      const { description, docinlog_url } = req.body;

      // Step 1: Find the document to update
      const docinlog = await prisma.docinLog.findUnique({
        where: {
          id: Number(docinlogId),
        },
      });

      if (!docinlog) {
        return res.status(404).json({ message: "Documentlog not found" });
      }

      // Step 3: If a new file is uploaded, delete the old file if it exists
      let docinlogoriginal = docinlog.docinlog_original;
      let docinlogfile = docinlog.docinlog_file;
      let docinlogtype = docinlog.docinlog_type;
      let docinlogsize = docinlog.docinlog_size;
      if (req.file) {
        if (docinlog.docinlog_file) {
          const oldfiledocPath = path.join(
            __dirname,
            "../../../uploads/documentlog", // Assuming the file is stored here
            path.basename(docinlog.docinlog_file),
          );
          fs.unlink(oldfiledocPath, (err) => {
            if (err) {
              console.error("Error deleting old file: ", err);
            }
          });
        }

        docinlogoriginal = Buffer.from(
          req.file.originalname,
          "latin1",
        ).toString("utf8");
        docinlogfile = req.file.filename;
        docinlogtype = req.file.mimetype;
        docinlogsize = req.file.size;
      }

      // Step 4: Update the docinLog record
      const updated = await prisma.docinLog.update({
        where: {
          id: Number(docinlogId),
        },
        data: {
          description: description,
          docinlog_original: docinlogoriginal,
          docinlog_file: docinlogfile,
          docinlog_type: docinlogtype,
          docinlog_size: docinlogsize,
          docinlog_url: docinlog_url ?? null,
        },
      });

      res.json({ message: "Update successful!", data: updated });
    } catch (err) {
      console.log(err); // Added logging for better error debugging
      res.status(500).json({ message: "Server Error", error: err.message });
    }
  });
};
