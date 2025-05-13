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

const upload = multer({ storage: storage }).single("docex_file");

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
      const { docexternalId } = req.params;
      const {
        docex_no,
        docex_date,
        docex_title,
        docex_description,
        outsiderId,
        priorityId,
        doctypeId,
      } = req.body;

      // Step 1: Find the document to update
      const docex = await prisma.docExternal.findUnique({
        where: {
          id: Number(docexternalId),
        },
      });

      if (!docex) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Step 3: If a new file is uploaded, delete the old file if it exists
      let docexfileoriginal = docex.docex_fileoriginal;
      let docexfile = docex.docex_file;
      let docextype = docex.docex_filetype;
      let docexsize = docex.docex_filesize;
      if (req.file) {
        console.log("New file uploaded:", req.file.filename); // Debugging line
        if (docex.docex_file) {
          const oldfiledocPath = path.join(
            __dirname,
            "../../../uploads/document", // Assuming the file is stored here
            path.basename(docex.docex_file)
          );
          fs.unlink(oldfiledocPath, (err) => {
            if (err) {
              console.error("Error deleting old file: ", err);
            }
          });
        }

        docexfileoriginal = Buffer.from(
          req.file.originalname,
          "latin1"
        ).toString("utf8");
        docexfile = req.file.filename;
        docextype = req.file.mimetype;
        docexsize = req.file.size;
      }

      // Step 4: Update the docExternal record
      const updated = await prisma.docExternal.update({
        where: {
          id: Number(docexternalId),
        },
        data: {
          docex_no,
          docex_date: new Date(docex_date),
          docex_title,
          docex_description,
          outsiderId: Number(outsiderId),
          priorityId: Number(priorityId),
          doctypeId: Number(doctypeId),
          creatorCode: req.user.username,
          docex_fileoriginal: docexfileoriginal,
          docex_file: docexfile,
          docex_filetype: docextype,
          docex_filesize: docexsize,
        },
        include: {
          priority: true,
          doctype: true,
          outsider: true,
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
