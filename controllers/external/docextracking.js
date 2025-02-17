const fs = require("fs");
const prisma = require("../../prisma/prisma");
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

exports.create = async (req, res) => {
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
        docexId,
        receiverCode,
        departmentId,
        docstatusId,
        dateline,
        description,
        active,
      } = req.body;

      if (!docexId) {
        return res.status(400).json({ message: "Required fields are missing" });
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

      const datel = await prisma.docexTracking.findFirst({
        where: { docexId: Number(docexId) },
      });

      const datelineValue = dateline
        ? new Date(dateline)
        : datel?.dateline
        ? new Date(datel.dateline)
        : null;

      const [docexlogs, existingTracking] = await prisma.$transaction([
        prisma.docexLog.create({
          data: {
            docexId: Number(docexId),
            assignerCode: req.user.emp_code,
            receiverCode: user.emp_code,
            rankId: user.rankId,
            roleId: user.roleId,
            positionId: user.posId,
            departmentId: user.departmentId,
            divisionId: user.divisionId,
            officeId: user.officeId,
            unitId: user.unitId,
            docstatusId: Number(docstatusId),
            dateline: datelineValue,
            description,
            active,
            docexlog_file: req.file ? req.file.filename : null,
            docexlog_type: req.file ? req.file.mimetype : null,
            docexlog_size: req.file ? req.file.size : null,
          },
        }),
        prisma.docexTracking.findFirst({
          where: {
            docexId: Number(docexId),
            receiverCode: req.user.emp_code,
          },
        }),
      ]);

      const docextrackings = await prisma.docexTracking.update({
        where: {
          id: existingTracking.id,
        },
        data: {
          assignerCode: req.user.emp_code,
          receiverCode: user.emp_code,
          docstatusId: Number(docstatusId),
          dateline: datelineValue,
          description,
          active,
          docexlog_file: req.file ? req.file.filename : null,
          docexlog_type: req.file ? req.file.mimetype : null,
          docexlog_size: req.file ? req.file.size : null,
        },
      });

      res.status(201).json({
        message: "Document created successfully",
        data: { docexlogs, docextrackings },
      });
    } catch (error) {
      console.error("Error creating document :", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
};

exports.list = async (req, res) => {
  try {
    const doctrackings = await prisma.docexTracking.findMany({
      where: {
        receiverCode: req.user.emp_code,
      },
      include: {
        docexternal: {
          include: {
            outsider: true,
            priority: true,
            doctype: true,
          },
        },
        assigner: {
          select: {
            first_name: true,
            last_name: true,
            gender: true,
            tel: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format dates
    const formattedDocs = doctrackings.map((doc) => ({
      ...doc,
      createdAt: moment(doc.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(doc.updatedAt).tz("Asia/Vientiane").format(),
      docexternal: {
        ...doc.docexternal,
        createdAt: moment(doc.docexternal.createdAt)
          .tz("Asia/Vientiane")
          .format(),
        updatedAt: moment(doc.docexternal.updatedAt)
          .tz("Asia/Vientiane")
          .format(),
      },
    }));

    res.status(200).json(formattedDocs);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// exports.director = async (req, res) => {
//   try {
//     const {
//       docexId,
//       departmentId,
//       priorityId,
//       docstatusId,
//       dateline,
//       description,
//       active,
//     } = req.body;

//     if (!docexId) {
//       return res.status(400).json({ message: "docexId is required" });
//     }

//     const department = await prisma.department.findUnique({
//       where: { id: Number(departmentId) },
//       include: { users: true },
//     });

//     if (!department || !department.users.length) {
//       return res.status(404).json({ message: "Department or users not found" });
//     }

//     user = department.users.find((u) => u.rankId === 1 && u.roleId === 6);

//     if (!user) {
//       return res.status(404).json({
//         message:
//           "No matching user found with specified rank, role, and position",
//       });
//     }

//     const [docexternals, docexlogs, existingTracking] =
//       await prisma.$transaction([
//         prisma.docExternal.update({
//           where: {
//             id: Number(docexId),
//           },
//           data: {
//             priorityId: Number(priorityId),
//           },
//         }),
//         prisma.docexLog.create({
//           data: {
//             docexId: Number(docexId),
//             assignerCode: req.user.emp_code,
//             receiverCode: user.emp_code,
//             rankId: user.rankId,
//             roleId: user.roleId,
//             positionId: user.posId,
//             departmentId: user.departmentId,
//             docstatusId: Number(docstatusId),
//             dateline: dateline ? new Date(dateline) : null,
//             description,
//             active,
//           },
//         }),
//         prisma.docexTracking.findFirst({
//           where: {
//             docexId: Number(docexId),
//             receiverCode: req.user.emp_code,
//           },
//         }),
//       ]);

//     const docextrackings = await prisma.docexTracking.update({
//       where: {
//         id: existingTracking.id,
//       },
//       data: {
//         assignerCode: req.user.emp_code,
//         receiverCode: user.emp_code,
//         docstatusId: Number(docstatusId),
//         dateline: dateline ? new Date(dateline) : null,
//         description,
//         active,
//       },
//     });

//     res.status(201).json({
//       message: "Document created successfully",
//       data: { docexternals, docexlogs, docextrackings },
//     });
//   } catch (error) {
//     console.error("Error creating document:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };
