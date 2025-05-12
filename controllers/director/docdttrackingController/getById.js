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
  try {
    const { doctrackingId } = req.params;
    const doctrackings = await prisma.docdtTracking.findUnique({
      where: {
        id: Number(doctrackingId),
      },
      include: {
        docstatus: true,
        docdirector: {
          include: {
            priority: true,
            doctype: true,
            creator: {
              select: {
                username: true,
                rankId: true,
                roleId: true,
                employee: {
                  select: {
                    first_name: true,
                    last_name: true,
                    emp_code: true,
                    status: true,
                    gender: true,
                    tel: true,
                    email: true,
                    empimg: true,
                    posId: true,
                    departmentId: true,
                    divisionId: true,
                    officeId: true,
                    unitId: true,
                  },
                },
              },
            },
          },
        },
        assigner: {
          select: {
            username: true,
            employee: {
              select: {
                first_name: true,
                last_name: true,
                gender: true,
                tel: true,
              },
            },
          },
        },
      },
    });

    if (!doctrackings) {
      return res.status(404).json({ message: "Document tracking not found" });
    }

    // Format dates
    const formattedDoc = {
      ...doctrackings,
      createdAt: moment(doctrackings.createdAt)
        .tz("Asia/Vientiane")
        .format("YYYY-MM-DD HH:mm:ss"),
      updatedAt: moment(doctrackings.updatedAt)
        .tz("Asia/Vientiane")
        .format("YYYY-MM-DD HH:mm:ss"),
      docdirector: doctrackings.docdirector
        ? {
            ...doctrackings.docdirector,
            createdAt: moment(doctrackings.docdirector.createdAt)
              .tz("Asia/Vientiane")
              .format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: moment(doctrackings.docdirector.updatedAt)
              .tz("Asia/Vientiane")
              .format("YYYY-MM-DD HH:mm:ss"),
          }
        : null,
    };

    res.status(200).json(formattedDoc);
  } catch (err) {
    console.error("Error fetching document tracking:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
