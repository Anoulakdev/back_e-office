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

const upload = multer({ storage: storage }).single("docex_file");

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
        docex_no,
        docex_date,
        docex_dateline,
        docex_title,
        docex_description,
        outsiderId,
        priorityId,
        doctypeId,
      } = req.body;

      if (!docex_no || !docex_date) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const newDocExternal = await prisma.docExternal.create({
        data: {
          docex_no,
          docex_date: new Date(docex_date),
          docex_dateline: docex_dateline ? new Date(docex_dateline) : null,
          docex_title,
          docex_description,
          outsiderId: Number(outsiderId),
          priorityId: Number(priorityId),
          doctypeId: Number(doctypeId),
          creatorCode: req.user.emp_code,
          docex_file: req.file ? req.file.filename : null,
          docex_filetype: req.file ? req.file.mimetype : null,
          docex_filesize: req.file ? req.file.size : null,
        },
      });

      // console.log("New document external:", newDocExternal);

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
        priority: true,
        doctype: true,
        outsider: true,
        creator: {
          select: {
            first_name: true,
            last_name: true,
            emp_code: true,
            gender: true,
            tel: true,
            email: true,
            userimg: true,
          },
        },
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
        priority: true,
        doctype: true,
        outsider: true,
        creator: {
          select: {
            first_name: true,
            last_name: true,
            emp_code: true,
            gender: true,
            tel: true,
            email: true,
            userimg: true,
          },
        },
        docexlogs: {
          include: {
            assigner: {
              select: {
                first_name: true,
                last_name: true,
                gender: true,
              },
            },
            receiver: {
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
        docex_no,
        docex_date,
        docex_dateline,
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
      let docexfile = docex.docex_file;
      let docextype = docex.docex_filetype;
      let docexsize = docex.docex_filesize;
      if (req.file) {
        console.log("New file uploaded:", req.file.filename); // Debugging line
        if (docex.docex_file) {
          const oldfiledocPath = path.join(
            __dirname,
            "../../uploads/document", // Assuming the file is stored here
            path.basename(docex.docex_file)
          );
          fs.unlink(oldfiledocPath, (err) => {
            if (err) {
              console.error("Error deleting old file: ", err);
            }
          });
        }

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
          docex_dateline: docex_dateline ? new Date(docex_dateline) : null,
          docex_title,
          docex_description,
          outsiderId: Number(outsiderId),
          priorityId: Number(priorityId),
          doctypeId: Number(doctypeId),
          creatorCode: req.user.emp_code,
          docex_file: docexfile,
          docex_filetype: docextype,
          docex_filesize: docexsize,
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
    if (docex.docex_file) {
      const filedocPath = path.join(
        __dirname,
        "../../uploads/document",
        docex.docex_file
      );
      fs.unlink(filedocPath, (err) => {
        if (err) {
          console.error("Error deleting file: ", err);
          return res.status(500).json({ message: "Error deleting file" });
        }
      });
    }

    await prisma.docexLog.deleteMany({
      where: { docexId: Number(docexternalId) },
    });

    await prisma.docexTracking.deleteMany({
      where: { docexId: Number(docexternalId) },
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

exports.assign = async (req, res) => {
  try {
    const {
      docexId,
      receiverCode,
      departmentId,
      docstatusId,
      description,
      active,
    } = req.body;

    if (!docexId) {
      return res.status(400).json({ message: "docexId is required" });
    }

    let user = null;

    if (departmentId && !isNaN(Number(departmentId))) {
      const department = await prisma.department.findUnique({
        where: { id: Number(departmentId) },
        include: { users: true },
      });

      if (!department || !department.users.length) {
        return res
          .status(404)
          .json({ message: "Department or users not found" });
      }

      user = department.users.find((u) => u.rankId === 1 && u.roleId === 6);

      if (!user) {
        return res.status(404).json({
          message:
            "No matching user found with specified rank, role, and position",
        });
      }
    } else if (receiverCode) {
      user = await prisma.user.findUnique({
        where: { emp_code: receiverCode },
      });

      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found with the provided receiverCode" });
      }
    } else {
      return res.status(400).json({
        message: "Either departmentId or receiverCode is required",
      });
    }

    const [docexternals, docexlogs, docextrackings] = await prisma.$transaction(
      [
        prisma.docExternal.update({
          where: {
            id: Number(docexId),
          },
          data: {
            assignto: 1,
          },
        }),
        prisma.docexLog.create({
          data: {
            docexId: Number(docexId),
            assignerCode: req.user.emp_code,
            receiverCode: user.emp_code,
            rankId: Number(user.rankId),
            roleId: Number(user.roleId),
            positionId: Number(user.posId),
            docstatusId: Number(docstatusId),
            description,
            active,
            departmentId: departmentId ? Number(departmentId) : null,
          },
        }),
        prisma.docexTracking.create({
          data: {
            docexId: Number(docexId),
            assignerCode: req.user.emp_code,
            receiverCode: user.emp_code,
            docstatusId: Number(docstatusId),
            description,
            active,
          },
        }),
      ]
    );

    res.status(201).json({
      message: "Document departments created successfully",
      data: { docexternals, docexlogs, docextrackings },
    });
  } catch (error) {
    console.error("Error creating document departments:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
