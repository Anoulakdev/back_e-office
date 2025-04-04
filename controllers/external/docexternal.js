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
        docex_title,
        docex_description,
        outsiderId,
        priorityId,
        doctypeId,
        extype,
      } = req.body;

      if (!docex_no) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const newDocExternal = await prisma.docExternal.create({
        data: {
          docex_no,
          docex_date: new Date(docex_date),
          docex_title,
          docex_description,
          outsiderId: Number(outsiderId),
          priorityId: Number(priorityId),
          doctypeId: Number(doctypeId),
          extype: Number(extype),
          creatorCode: req.user.emp_code,
          docex_file: req.file ? req.file.filename : null,
          docex_filetype: req.file ? req.file.mimetype : null,
          docex_filesize: req.file ? req.file.size : null,
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
            },
          },
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
    const {
      search,
      priority,
      outsider,
      assignto,
      extype,
      selectDateStart,
      selectDateEnd,
      // page,
      // limit,
    } = req.query;

    // แปลงค่า page & limit เป็นตัวเลข
    // const pageNumber = Number(page) || 1;
    // const pageSize = Number(limit) || 10;

    // คำนวณค่าการแบ่งหน้า
    // const skip = (pageNumber - 1) * pageSize;
    // const take = pageSize;

    // สร้างเงื่อนไข where
    const where = {
      creatorCode: req.user.emp_code,
    };

    if (search) {
      where.OR = [
        { docex_no: { contains: search, mode: "insensitive" } },
        { docex_title: { contains: search, mode: "insensitive" } },
      ];
    }

    if (priority) {
      where.priorityId = Number(priority);
    }

    if (extype) {
      where.extype = Number(extype);
    }

    if (assignto) {
      where.assignto = Number(assignto);
    } else if (assignto === null || assignto === "null") {
      where.assignto = null;
    }

    if (outsider) {
      where.outsider = {
        is: {
          name: { contains: outsider, mode: "insensitive" },
        },
      };
    }

    if (selectDateStart && selectDateEnd) {
      const startDate = new Date(`${selectDateStart}T00:00:00+07:00`);

      const endDate = new Date(`${selectDateEnd}T23:59:59+07:00`);

      where.createdAt = {
        gte: new Date(startDate.toISOString()),
        lte: new Date(endDate.toISOString()),
      };
    }

    const docexternals = await prisma.docExternal.findMany({
      where,
      // skip,
      // take,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        docexlogs: {
          include: {
            docstatus: true,
          },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        priority: true,
        doctype: true,
        outsider: {
          include: {
            belongto: true,
          },
        },
        creator: {
          select: {
            first_name: true,
            last_name: true,
            emp_code: true,
            gender: true,
            tel: true,
            email: true,
          },
        },
      },
    });

    // const total = await prisma.docExternal.count({ where });

    // Format dates
    const formattedDocs = docexternals.map((doc) => ({
      ...doc,
      createdAt: moment(doc.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(doc.updatedAt).tz("Asia/Vientiane").format(),
    }));

    res.json(formattedDocs);

    // res.json({
    //   total,
    //   page: pageNumber,
    //   limit: pageSize,
    //   totalPages: Math.ceil(total / pageSize),
    //   formattedDocs,
    // });
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
        outsider: {
          include: {
            belongto: true,
          },
        },
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
            docstatus: true,
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

exports.remove = async (req, res) => {
  try {
    const { docexternalId } = req.params;

    const docex = await prisma.docExternal.findUnique({
      where: {
        id: Number(docexternalId),
      },
    });

    if (!docex) {
      return res.status(404).json({ message: "Document not found" });
    }

    // ลบไฟล์ของ docExternal
    if (docex.docex_file) {
      const filedocPath = path.join(
        __dirname,
        "../../uploads/document",
        docex.docex_file
      );
      if (fs.existsSync(filedocPath)) {
        fs.unlinkSync(filedocPath);
      }
    }

    // ค้นหา logs ที่เกี่ยวข้อง
    const docexLogs = await prisma.docexLog.findMany({
      where: { docexId: Number(docexternalId) },
    });

    // ลบไฟล์ของแต่ละ log โดยไม่ให้เกิด error ถ้าไฟล์ถูกลบไปแล้ว
    const deletedFiles = new Set(); // ใช้ Set เพื่อตรวจสอบชื่อไฟล์ที่เคยลบไปแล้ว
    for (const log of docexLogs) {
      if (log.docexlog_file) {
        const logFilePath = path.join(
          __dirname,
          "../../uploads/documentlog",
          log.docexlog_file
        );

        if (
          !deletedFiles.has(log.docexlog_file) &&
          fs.existsSync(logFilePath)
        ) {
          fs.unlinkSync(logFilePath);
          deletedFiles.add(log.docexlog_file);
        }
      }
    }

    await prisma.docexLog.deleteMany({
      where: { docexId: Number(docexternalId) },
    });

    await prisma.docexTracking.deleteMany({
      where: { docexId: Number(docexternalId) },
    });

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
      const {
        docexId,
        receiverCode,
        departmentId1,
        departmentId2 = [],
        docstatusId,
        description,
      } = req.body;

      if (!docexId) {
        return res.status(400).json({ message: "docexId is required" });
      }

      let logTransactions = [];
      const docex = await prisma.docExternal.findUnique({
        where: {
          id: Number(docexId),
        },
      });

      if (receiverCode) {
        // 🔹 ถ้ามี receiverCode ใช้ข้อมูลนี้เท่านั้น
        const user = await prisma.user.findUnique({
          where: { emp_code: receiverCode },
        });

        if (!user) {
          return res
            .status(404)
            .json({ message: "User not found with the provided receiverCode" });
        }

        if (!docex) {
          return res
            .status(404)
            .json({ message: "Document not found with the provided docexId" });
        }

        logTransactions.push(
          prisma.docexLog.create({
            data: {
              docexId: Number(docexId),
              assignerCode: req.user.emp_code,
              receiverCode: user.emp_code,
              rankId: Number(user.rankId) ?? null,
              roleId: Number(user.roleId) ?? null,
              positionId: Number(user.posId) ?? null,
              docstatusId: Number(docstatusId),
              extype: Number(docex.extype) ?? null,
              description,
              departmentId: user.departmentId ?? null,
              departmentactive: null,
            },
          }),
          prisma.docexTracking.create({
            data: {
              docexId: Number(docexId),
              assignerCode: req.user.emp_code,
              receiverCode: user.emp_code,
              docstatusId: Number(docstatusId),
              extype: Number(docex.extype) ?? null,
              description,
            },
          })
        );
      } else {
        // 🔹 ถ้าไม่มี receiverCode ใช้ departmentId1 และ departmentId2 (ถ้ามี)
        const allDepartments = [
          ...(Array.isArray(departmentId1) && departmentId1.length
            ? departmentId1.map((id) => ({
                id: Number(id),
                departmentactive: 1,
              }))
            : []),
          ...(Array.isArray(departmentId2) && departmentId2.length
            ? departmentId2.map((id) => ({
                id: Number(id),
                departmentactive: 2,
              }))
            : []),
        ];

        if (!allDepartments.length) {
          return res
            .status(400)
            .json({ message: "At least one departmentId is required" });
        }

        for (const { id: departmentId, departmentactive } of allDepartments) {
          const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: { users: true },
          });

          if (!department || !department.users.length) {
            return res.status(404).json({
              message: `Department ${departmentId} or users not found`,
            });
          }

          const depUser = department.users.find(
            (u) => u.rankId === 1 && u.roleId === 6
          );

          if (!depUser) {
            return res.status(404).json({
              message: `No matching user found in department ${departmentId} with specified rank and role`,
            });
          }

          const docex = await prisma.docExternal.findUnique({
            where: {
              id: Number(docexId),
            },
          });

          if (!docex) {
            return res.status(404).json({
              message: "Document not found with the provided docexId",
            });
          }

          logTransactions.push(
            prisma.docexLog.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.emp_code,
                receiverCode: depUser.emp_code,
                rankId: Number(depUser.rankId) ?? null,
                roleId: Number(depUser.roleId) ?? null,
                positionId: Number(depUser.posId) ?? null,
                docstatusId: Number(docstatusId) ?? null,
                extype: Number(docex.extype) ?? null,
                description,
                departmentId,
                departmentactive, // 🔸 กำหนดค่า departmentactive ตาม group
              },
            }),
            prisma.docexTracking.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.emp_code,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                description,
                extype: Number(docex.extype) ?? null,
                departmentactive,
              },
            })
          );
        }
      }

      // อัปเดตสถานะของ docexternal
      const updateDocExternal = prisma.docExternal.update({
        where: {
          id: Number(docexId),
        },
        data: {
          assignto: 1,
        },
      });

      const transactions = [updateDocExternal, ...logTransactions];

      const results = await prisma.$transaction(transactions);

      res.status(201).json({
        message: "Document assigned successfully",
        data: results,
      });
    } catch (error) {
      console.error("Error assigning document:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
};
