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

const upload = multer({ storage: storage }).single("docdt_file");

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
      const { docdirectorId } = req.params;
      const {
        docdt_no,
        docdt_date,
        docdt_title,
        docdt_description,
        priorityId,
        doctypeId,
      } = req.body;

      // Step 1: Find the document to update
      const docdt = await prisma.docDirector.findUnique({
        where: {
          id: Number(docdirectorId),
        },
      });

      if (!docdt) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Step 3: If a new file is uploaded, delete the old file if it exists
      let docdtfileoriginal = docdt.docdt_fileoriginal;
      let docdtfile = docdt.docdt_file;
      let docdttype = docdt.docdt_filetype;
      let docdtsize = docdt.docdt_filesize;
      if (req.file) {
        console.log("New file uploaded:", req.file.filename); // Debugging line
        if (docdt.docdt_file) {
          const oldfiledocPath = path.join(
            __dirname,
            "../../../uploads/document", // Assuming the file is stored here
            path.basename(docdt.docdt_file)
          );
          fs.unlink(oldfiledocPath, (err) => {
            if (err) {
              console.error("Error deleting old file: ", err);
            }
          });
        }

        docdtfileoriginal = Buffer.from(req.file.originalname).toString("utf8");
        docdtfile = req.file.filename;
        docdttype = req.file.mimetype;
        docdtsize = req.file.size;
      }

      // Step 4: Update the docDirector record
      const updated = await prisma.docDirector.update({
        where: {
          id: Number(docdirectorId),
        },
        data: {
          docdt_no,
          docdt_date: new Date(docdt_date),
          docdt_title,
          docdt_description,
          priorityId: Number(priorityId),
          doctypeId: Number(doctypeId),
          creatorCode: req.user.username,
          docdt_fileoriginal: docdtfileoriginal,
          docdt_file: docdtfile,
          docdt_filetype: docdttype,
          docdt_filesize: docdtsize,
        },
        include: {
          priority: true,
          doctype: true,
          creator: {
            select: {
              username: true,
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
