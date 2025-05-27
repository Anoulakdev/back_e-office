const fs = require("fs");
const prisma = require("../../prisma/prisma");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/docexport");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }).single("export_file");

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
      const { docexportId } = req.params;
      const { export_text, export_title, export_description } = req.body;

      const doc = await prisma.docExport.findUnique({
        where: {
          id: Number(docexportId),
        },
      });

      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }

      let docfileoriginal = doc.export_fileoriginal;
      let docfile = doc.export_file;
      let doctype = doc.export_filetype;
      let docsize = doc.export_filesize;
      if (req.file) {
        console.log("New file uploaded:", req.file.filename);
        if (doc.export_file) {
          const oldfiledocPath = path.join(
            __dirname,
            "../../uploads/docexport", // Assuming the file is stored here
            path.basename(doc.export_file)
          );
          fs.unlink(oldfiledocPath, (err) => {
            if (err) {
              console.error("Error deleting old file: ", err);
            }
          });
        }

        docfileoriginal = Buffer.from(req.file.originalname, "latin1").toString(
          "utf8"
        );
        docfile = req.file.filename;
        doctype = req.file.mimetype;
        docsize = req.file.size;
      }

      const updated = await prisma.docExport.update({
        where: {
          id: Number(docexportId),
        },
        data: {
          export_text: export_text,
          export_title: export_title,
          export_description: export_description,
          export_status: true,
          exporterCode: req.user.username,
          export_fileoriginal: docfileoriginal,
          export_file: docfile,
          export_filetype: doctype,
          export_filesize: docsize,
        },
        include: {
          signator: {
            select: {
              username: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  emp_code: true,
                  gender: true,
                },
              },
            },
          },
          exporter: {
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

      res.json({ message: "Updated Success!! ", data: updated });
    } catch (err) {
      // err
      console.log(err);
      res.status(500).json({ message: "Server Error" });
    }
  });
};
