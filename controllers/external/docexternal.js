const fs = require("fs");
const prisma = require("../../prisma/prisma");
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

const upload = multer({ storage: storage }).single("filedocument");

exports.create = (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res
        .status(500)
        .json({ message: "Multer error", error: err.message });
    } else if (err) {
      return res
        .status(500)
        .json({ message: "Unknown error", error: err.message });
    }

    try {
      const {
        outsider,
        datedocument,
        no,
        title,
        description,
        docimportantId,
        doctypeId,
        docstatusId,
        datesuccess,
        directorCode,
        departmentId,
      } = req.body;

      if (!outsider || !no || !title) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      let director = null;
      if (directorCode) {
        director = await prisma.user.findUnique({
          where: { code: directorCode },
        });

        if (!director) {
          return res.status(400).json({ message: "Invalid director code" });
        }
      }

      const newDocExternal = await prisma.docExternal.create({
        data: {
          outsider,
          datedocument: new Date(datedocument),
          no,
          title,
          description,
          docimportantId: Number(docimportantId),
          doctypeId: Number(doctypeId),
          docstatusId: Number(docstatusId),
          datesuccess: new Date(datesuccess),
          creatorCode: req.user.code,
          filedocument: req.file ? req.file.filename : null,
          ...(director && {
            directorCode,
            roleId: Number(director.roleId),
            levelId: Number(director.levelId),
          }),
          ...(departmentId
            ? {
                DocexDepartment: {
                  create: {
                    department: { connect: { id: Number(departmentId) } },
                  },
                },
              }
            : null), // สร้าง DocexDepartment เฉพาะเมื่อ departmentId มีค่า
        },
        include: { DocexDepartment: true },
      });

      console.log("New document external:", newDocExternal);

      res.status(201).json({
        message: "Document created successfully",
        data: newDocExternal,
      });
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
};

exports.list = async (req, res) => {
  try {
    const docexternals = await prisma.docExternal.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        creator: {
          select: {
            id: true,
            code: true,
            firstname: true,
            lastname: true,
          },
        },
        docimportant: {
          select: {
            id: true,
            name: true,
          },
        },
        doctype: {
          select: {
            id: true,
            name: true,
          },
        },
        docstatus: {
          select: {
            id: true,
            name: true,
          },
        },
        DocexDepartment: {
          orderBy: {
            id: "asc",
          },
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      omit: {
        docimportantId: true,
        doctypeId: true,
        docstatusId: true,
      },
    });

    // Format dates
    const formattedDocs = docexternals.map((doc) => ({
      ...doc,
      createdAt: moment(doc.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(doc.updatedAt).tz("Asia/Vientiane").format(),
    }));

    res.json(formattedDocs);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { docexternalId } = req.params;

    const docex = await prisma.docExternal.findUnique({
      where: {
        id: Number(docexternalId),
      },
      include: {
        docimportant: {
          select: {
            id: true,
            name: true,
          },
        },
        doctype: {
          select: {
            id: true,
            name: true,
          },
        },
        docstatus: {
          select: {
            id: true,
            name: true,
          },
        },
        DocexDepartment: {
          orderBy: {
            id: "asc",
          },
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      omit: {
        docimportantId: true,
        doctypeId: true,
        docstatusId: true,
      },
    });

    if (!docex) {
      return res.status(404).json({ message: "document not found" });
    }

    // Format dates
    const formattedDocs = {
      ...docex,
      createdAt: moment(docex.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(docex.updatedAt).tz("Asia/Vientiane").format(),
    };

    res.json(formattedDocs);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.update = async (req, res) => {
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
        outsider,
        datedocument,
        no,
        title,
        description,
        docimportantId,
        doctypeId,
        docstatusId,
        datesuccess,
        directorCode,
        departmentId,
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

      console.log("Found document:", docex); // Debugging line

      let director = null;
      if (directorCode) {
        director = await prisma.user.findUnique({
          where: { code: directorCode },
        });

        if (!director) {
          return res.status(400).json({ message: "Invalid director code" });
        }
      }

      // Step 2: Delete existing DocexDepartment associations (if any)
      await prisma.docexDepartment.deleteMany({
        where: { docexternalId: Number(docexternalId) },
      });

      // Step 3: If a new file is uploaded, delete the old file if it exists
      let filedocPath = docex.filedocument;
      if (req.file) {
        console.log("New file uploaded:", req.file.filename); // Debugging line
        if (docex.filedocument) {
          const oldfiledocPath = path.join(
            __dirname,
            "../uploads/document", // Assuming the file is stored here
            path.basename(docex.filedocument)
          );
          fs.unlink(oldfiledocPath, (err) => {
            if (err) {
              console.error("Error deleting old file: ", err);
            }
          });
        }

        filedocPath = req.file.filename; // Save the new file path
      }

      // Step 4: Update the docExternal record
      const updated = await prisma.docExternal.update({
        where: {
          id: Number(docexternalId),
        },
        data: {
          outsider,
          datedocument: new Date(datedocument),
          no,
          title,
          description,
          docimportantId: Number(docimportantId),
          doctypeId: Number(doctypeId),
          docstatusId: Number(docstatusId),
          datesuccess: new Date(datesuccess),
          creatorCode: req.user.code, // Ensure req.user is populated correctly
          filedocument: filedocPath,
          directorCode: director ? directorCode : null, // Set null if director is not found
          roleId: director ? Number(director.roleId) : null, // Set null if director is not found
          levelId: director ? Number(director.levelId) : null, // Set null if director is not found
          ...(departmentId
            ? {
                DocexDepartment: {
                  create: {
                    department: { connect: { id: Number(departmentId) } },
                  },
                },
              }
            : null),
        },
      });

      res.json({ message: "Update successful!", data: updated });
    } catch (err) {
      console.log(err); // Added logging for better error debugging
      res.status(500).json({ message: "Server Error", error: err.message });
    }
  });
};

exports.remove = async (req, res) => {
  try {
    const { docexternalId } = req.params;

    // Step 1: Find the user by ID
    const docex = await prisma.docExternal.findUnique({
      where: {
        id: Number(docexternalId),
      },
    });

    if (!docex) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Step 2: Delete the photo file if it exists
    if (docex.filedocument) {
      const filedocPath = path.join(
        __dirname,
        "../uploads/document",
        docex.filedocument
      );
      fs.unlink(filedocPath, (err) => {
        if (err) {
          console.error("Error deleting file: ", err);
          return res.status(500).json({ message: "Error deleting file" });
        }
      });
    }

    // Delete related records in docexDepartment
    await prisma.docexDepartment.deleteMany({
      where: { docexternalId: Number(docexternalId) },
    });

    // Step 3: Delete the document from the database
    await prisma.docExternal.delete({
      where: {
        id: Number(docexternalId),
      },
    });

    res.status(200).json({ message: "Document deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
