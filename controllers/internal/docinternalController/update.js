const fs = require("fs");
const prisma = require("../../../prisma/prisma");
const multer = require("multer");
const path = require("path");
const moment = require("moment-timezone");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/document");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }).single("docin_file");

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
      const { docinternalId } = req.params;
      const {
        docin_no,
        docin_date,
        docin_title,
        docin_description,
        priorityId,
        doctypeId,
      } = req.body;

      // Step 1: Find the document to update
      const docin = await prisma.docInternal.findUnique({
        where: {
          id: Number(docinternalId),
        },
      });

      if (!docin) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Step 3: If a new file is uploaded, delete the old file if it exists
      let docinfileoriginal = docin.docin_fileoriginal;
      let docinfile = docin.docin_file;
      let docintype = docin.docin_filetype;
      let docinsize = docin.docin_filesize;
      if (req.file) {
        console.log("New file uploaded:", req.file.filename); // Debugging line
        if (docin.docin_file) {
          const oldfiledocPath = path.join(
            __dirname,
            "../../../uploads/document", // Assuming the file is stored here
            path.basename(docin.docin_file)
          );
          fs.unlink(oldfiledocPath, (err) => {
            if (err) {
              console.error("Error deleting old file: ", err);
            }
          });
        }

        docinfileoriginal = req.file.originalname;
        docinfile = req.file.filename;
        docintype = req.file.mimetype;
        docinsize = req.file.size;
      }

      // Step 4: Update the docInternal record
      const updated = await prisma.docInternal.update({
        where: {
          id: Number(docinternalId),
        },
        data: {
          docin_no,
          docin_date: new Date(docin_date),
          docin_title,
          docin_description,
          priorityId: Number(priorityId),
          doctypeId: Number(doctypeId),
          creatorCode: req.user.username,
          docin_fileoriginal: docinfileoriginal,
          docin_file: docinfile,
          docin_filetype: docintype,
          docin_filesize: docinsize,
        },
        include: {
          priority: true,
          doctype: true,
          creator: {
            select: {
              username: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  gender: true,
                },
              },
            },
          },
        },
      });

      res.json({ message: "Update successful!", data: updated });
    } catch (err) {
      console.log(err); // Added logging for better error debugging
      res.status(500).json({ message: "Server Error", error: err.message });
    }
  });
};
