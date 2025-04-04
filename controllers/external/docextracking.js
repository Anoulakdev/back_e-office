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
        divisionId,
        officeId,
        unitId,
        priorityId,
        docstatusId,
        dateline,
        description,
        active,
      } = req.body;

      if (!docexId) {
        return res.status(400).json({ message: "Required fields are missing" });
      }

      let user = null;

      if (divisionId && !isNaN(Number(divisionId))) {
        const division = await prisma.division.findUnique({
          where: { id: Number(divisionId) },
          include: { users: true },
        });

        if (!division || !division.users.length) {
          return res
            .status(404)
            .json({ message: "division or users not found" });
        }

        user = division.users.find((u) => u.rankId === 1 && u.roleId === 7);

        if (!user) {
          return res.status(404).json({
            message:
              "No matching user found with specified rank, role, and position",
          });
        }
      } else if (officeId && !isNaN(Number(officeId))) {
        const office = await prisma.office.findUnique({
          where: { id: Number(officeId) },
          include: { users: true },
        });

        if (!office || !office.users.length) {
          return res.status(404).json({ message: "office or users not found" });
        }

        user = office.users.find((u) => u.rankId === 1 && u.roleId === 8);

        if (!user) {
          return res.status(404).json({
            message:
              "No matching user found with specified rank, role, and position",
          });
        }
      } else if (unitId && !isNaN(Number(unitId))) {
        const unit = await prisma.unit.findUnique({
          where: { id: Number(unitId) },
          include: { users: true },
        });

        if (!unit || !unit.users.length) {
          return res.status(404).json({ message: "unit or users not found" });
        }

        user = unit.users.find((u) => u.rankId === 1 && u.roleId === 9);

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

      const updateData = {};
      if (priorityId) {
        updateData.priorityId = Number(priorityId);
      }

      const [docexternals, docexlogs, existingTracking] =
        await prisma.$transaction([
          prisma.docExternal.update({
            where: {
              id: Number(docexId),
            },
            data: updateData,
          }),
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
        data: { docexternals, docexlogs, docextrackings },
      });
    } catch (error) {
      console.error("Error creating document :", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
};

exports.list = async (req, res) => {
  try {
    const { selectDateStart, selectDateEnd } = req.query;
    const where = {};

    if (selectDateStart && selectDateEnd) {
      const startDate = new Date(`${selectDateStart}T00:00:00+07:00`);

      const endDate = new Date(`${selectDateEnd}T23:59:59+07:00`);

      where.createdAt = {
        gte: new Date(startDate.toISOString()),
        lte: new Date(endDate.toISOString()),
      };
    }
    const doctrackings = await prisma.docexTracking.findMany({
      where: {
        ...where,
        receiverCode: req.user.emp_code,
      },
      include: {
        docstatus: true,
        docexternal: {
          include: {
            outsider: true,
            priority: true,
            doctype: true,
            creator: {
              select: {
                first_name: true,
                last_name: true,
                emp_code: true,
                status: true,
                gender: true,
                tel: true,
                email: true,
                userimg: true,
                rankId: true,
                roleId: true,
                posId: true,
                departmentId: true,
                divisionId: true,
                officeId: true,
                unitId: true,
              },
            },
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

exports.getById = async (req, res) => {
  try {
    const { doctrackingId } = req.params;
    const doctrackings = await prisma.docexTracking.findUnique({
      where: {
        id: Number(doctrackingId),
      },
      include: {
        docstatus: true,
        docexternal: {
          include: {
            outsider: true,
            priority: true,
            doctype: true,
            creator: {
              select: {
                first_name: true,
                last_name: true,
                emp_code: true,
                status: true,
                gender: true,
                tel: true,
                email: true,
                userimg: true,
                rankId: true,
                roleId: true,
                posId: true,
                departmentId: true,
                divisionId: true,
                officeId: true,
                unitId: true,
              },
            },
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
      docexternal: doctrackings.docexternal
        ? {
            ...doctrackings.docexternal,
            createdAt: moment(doctrackings.docexternal.createdAt)
              .tz("Asia/Vientiane")
              .format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: moment(doctrackings.docexternal.updatedAt)
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

exports.director = async (req, res) => {
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
        departmentId1 = [],
        departmentId2 = [],
        docstatusId,
        description,
        priorityId,
        dateline,
      } = req.body;

      if (!docexId) {
        return res.status(400).json({ message: "docexId is required" });
      }

      let logTransactions = [];
      const existingTracking = await prisma.docexTracking.findFirst({
        where: { docexId: Number(docexId), receiverCode: req.user.emp_code },
      });

      const docex = await prisma.docExternal.findUnique({
        where: {
          id: Number(docexId),
        },
      });

      if (!receiverCode && !departmentId1.length && !departmentId2.length) {
        const existingLog = await prisma.docexLog.findFirst({
          where: { docexId: Number(docexId), receiverCode: req.user.emp_code },
          orderBy: { id: "desc" },
          take: 1,
        });

        if (existingLog) {
          logTransactions.push(
            prisma.docexLog.update({
              where: { id: existingLog.id },
              data: { docstatusId: Number(docstatusId), description },
            })
          );
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.delete({ where: { id: existingTracking.id } })
          );
        }
      } else if (receiverCode) {
        // 🔹 ถ้ามี receiverCode ใช้ข้อมูลนี้เท่านั้น
        const user = await prisma.user.findUnique({
          where: { emp_code: receiverCode },
        });

        if (!user) return res.status(404).json({ message: "User not found" });

        const datelineValue = dateline
          ? new Date(dateline)
          : existingTracking?.dateline
          ? new Date(existingTracking.dateline)
          : null;

        const updateData = {};
        if (priorityId) {
          updateData.priorityId = Number(priorityId);
        }

        let docexlogfileData = {
          docexlog_file: null,
          docexlog_type: null,
          docexlog_size: null,
        };

        if (req.file) {
          docexlogfileData = {
            docexlog_file: req.file.filename,
            docexlog_type: req.file.mimetype,
            docexlog_size: req.file.size,
          };
        } else if (Number(docstatusId) === 6) {
          if (existingTracking) {
            if (existingTracking.docstatusId === 5) {
              docexlogfileData = {
                docexlog_file: null,
                docexlog_type: null,
                docexlog_size: null,
              };
            } else if (existingTracking.docstatusId === 6) {
              docexlogfileData = {
                docexlog_file: existingTracking.docexlog_file ?? null,
                docexlog_type: existingTracking.docexlog_type ?? null,
                docexlog_size: existingTracking.docexlog_size ?? null,
              };
            }
          }
        } else if (Number(docstatusId) === 7) {
          docexlogfileData = {
            docexlog_file: existingTracking?.docexlog_file ?? null,
            docexlog_type: existingTracking?.docexlog_type ?? null,
            docexlog_size: existingTracking?.docexlog_size ?? null,
          };
        }

        logTransactions.push(
          prisma.docExternal.update({
            where: { id: Number(docexId) },
            data: updateData,
          }),
          prisma.docexLog.create({
            data: {
              docexId: Number(docexId),
              assignerCode: req.user.emp_code,
              receiverCode: user.emp_code,
              rankId: user.rankId ? Number(user.rankId) : null,
              roleId: user.roleId ? Number(user.roleId) : null,
              positionId: user.posId ? Number(user.posId) : null,
              docstatusId: Number(docstatusId),
              departmentId: user.departmentId ?? null,
              dateline: datelineValue,
              description: description ?? null,
              extype: Number(docex.extype) ?? null,
              ...docexlogfileData,
            },
          })
        );

        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.update({
              where: { id: existingTracking.id },
              data: {
                assignerCode: req.user.emp_code,
                receiverCode: user.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                ...docexlogfileData,
              },
            })
          );
        }
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

        // 🔹 วนลูปเพื่อเพิ่มข้อมูลก่อน
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

          const datelineValue = dateline
            ? new Date(dateline)
            : existingTracking?.dateline
            ? new Date(existingTracking.dateline)
            : null;

          const updateData = {};
          if (priorityId) {
            updateData.priorityId = Number(priorityId);
          }

          logTransactions.push(
            prisma.docExternal.update({
              where: { id: Number(docexId) },
              data: updateData,
            }),
            prisma.docexLog.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.emp_code,
                receiverCode: depUser.emp_code,
                rankId: depUser.rankId ? Number(depUser.rankId) : null,
                roleId: depUser.roleId ? Number(depUser.roleId) : null,
                positionId: depUser.posId ? Number(depUser.posId) : null,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                departmentId,
                departmentactive,
                docexlog_file: req.file ? req.file.filename : null,
                docexlog_type: req.file ? req.file.mimetype : null,
                docexlog_size: req.file ? req.file.size : null,
              },
            }),
            prisma.docexTracking.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.emp_code,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                departmentactive,
                docexlog_file: req.file ? req.file.filename : null,
                docexlog_type: req.file ? req.file.mimetype : null,
                docexlog_size: req.file ? req.file.size : null,
              },
            })
          );
        }

        // 🔹 ลบ existingTracking **หลังจากเพิ่มข้อมูลเสร็จ**
        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.delete({
              where: { id: existingTracking.id },
            })
          );
        }
      }

      const results = await prisma.$transaction(logTransactions);

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

exports.assistantdirector = async (req, res) => {
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
        departmentId1 = [],
        departmentId2 = [],
        docstatusId,
        description,
        dateline,
      } = req.body;

      if (!docexId) {
        return res.status(400).json({ message: "docexId is required" });
      }

      let logTransactions = [];
      const existingTracking = await prisma.docexTracking.findFirst({
        where: { docexId: Number(docexId), receiverCode: req.user.emp_code },
      });

      const docex = await prisma.docExternal.findUnique({
        where: {
          id: Number(docexId),
        },
      });

      if (!receiverCode && !departmentId1.length && !departmentId2.length) {
        const existingLog = await prisma.docexLog.findFirst({
          where: { docexId: Number(docexId), receiverCode: req.user.emp_code },
          orderBy: { id: "desc" },
          take: 1,
        });

        if (existingLog) {
          logTransactions.push(
            prisma.docexLog.update({
              where: { id: existingLog.id },
              data: { docstatusId: Number(docstatusId), description },
            })
          );
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.delete({ where: { id: existingTracking.id } })
          );
        }
      } else if (receiverCode) {
        // 🔹 ถ้ามี receiverCode ใช้ข้อมูลนี้เท่านั้น
        const user = await prisma.user.findUnique({
          where: { emp_code: receiverCode },
        });

        if (!user) return res.status(404).json({ message: "User not found" });

        const datelineValue = dateline
          ? new Date(dateline)
          : existingTracking?.dateline
          ? new Date(existingTracking.dateline)
          : null;

        let docexlogfileData = {
          docexlog_file: null,
          docexlog_type: null,
          docexlog_size: null,
        };

        if (req.file) {
          docexlogfileData = {
            docexlog_file: req.file.filename,
            docexlog_type: req.file.mimetype,
            docexlog_size: req.file.size,
          };
        } else if (Number(docstatusId) === 6) {
          if (existingTracking) {
            if (existingTracking.docstatusId === 5) {
              docexlogfileData = {
                docexlog_file: null,
                docexlog_type: null,
                docexlog_size: null,
              };
            } else if (existingTracking.docstatusId === 6) {
              docexlogfileData = {
                docexlog_file: existingTracking.docexlog_file ?? null,
                docexlog_type: existingTracking.docexlog_type ?? null,
                docexlog_size: existingTracking.docexlog_size ?? null,
              };
            }
          }
        } else if (Number(docstatusId) === 7) {
          docexlogfileData = {
            docexlog_file: existingTracking?.docexlog_file ?? null,
            docexlog_type: existingTracking?.docexlog_type ?? null,
            docexlog_size: existingTracking?.docexlog_size ?? null,
          };
        }

        logTransactions.push(
          prisma.docexLog.create({
            data: {
              docexId: Number(docexId),
              assignerCode: req.user.emp_code,
              receiverCode: user.emp_code,
              rankId: user.rankId ? Number(user.rankId) : null,
              roleId: user.roleId ? Number(user.roleId) : null,
              positionId: user.posId ? Number(user.posId) : null,
              docstatusId: Number(docstatusId),
              departmentId: user.departmentId ?? null,
              dateline: datelineValue,
              description: description ?? null,
              extype: Number(docex.extype) ?? null,
              ...docexlogfileData,
            },
          })
        );

        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.update({
              where: { id: existingTracking.id },
              data: {
                assignerCode: req.user.emp_code,
                receiverCode: user.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                ...docexlogfileData,
              },
            })
          );
        }
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

        // 🔹 วนลูปเพื่อเพิ่มข้อมูลก่อน
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

          const datelineValue = dateline
            ? new Date(dateline)
            : existingTracking?.dateline
            ? new Date(existingTracking.dateline)
            : null;

          logTransactions.push(
            prisma.docexLog.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.emp_code,
                receiverCode: depUser.emp_code,
                rankId: depUser.rankId ? Number(depUser.rankId) : null,
                roleId: depUser.roleId ? Number(depUser.roleId) : null,
                positionId: depUser.posId ? Number(depUser.posId) : null,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                departmentId,
                departmentactive,
                docexlog_file: req.file ? req.file.filename : null,
                docexlog_type: req.file ? req.file.mimetype : null,
                docexlog_size: req.file ? req.file.size : null,
              },
            }),
            prisma.docexTracking.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.emp_code,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                departmentactive,
                docexlog_file: req.file ? req.file.filename : null,
                docexlog_type: req.file ? req.file.mimetype : null,
                docexlog_size: req.file ? req.file.size : null,
              },
            })
          );
        }

        // 🔹 ลบ existingTracking **หลังจากเพิ่มข้อมูลเสร็จ**
        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.delete({
              where: { id: existingTracking.id },
            })
          );
        }
      }

      const results = await prisma.$transaction(logTransactions);

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

exports.department = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      const errorMsg =
        err instanceof multer.MulterError ? "Multer error" : "Unknown error";
      return res.status(500).json({ message: errorMsg, error: err.message });
    }

    try {
      const {
        docexId,
        receiverCode,
        divisionId1 = [],
        divisionId2 = [],
        docstatusId,
        description,
        dateline,
      } = req.body;
      if (!docexId)
        return res.status(400).json({ message: "docexId is required" });

      let logTransactions = [];
      const existingTracking = await prisma.docexTracking.findFirst({
        where: { docexId: Number(docexId), receiverCode: req.user.emp_code },
      });

      const docex = await prisma.docExternal.findUnique({
        where: {
          id: Number(docexId),
        },
      });

      if (!receiverCode && !divisionId1.length && !divisionId2.length) {
        const existingLog = await prisma.docexLog.findFirst({
          where: { docexId: Number(docexId), receiverCode: req.user.emp_code },
          orderBy: { id: "desc" },
          take: 1,
        });

        if (existingLog) {
          logTransactions.push(
            prisma.docexLog.update({
              where: { id: existingLog.id },
              data: { docstatusId: Number(docstatusId), description },
            })
          );
          logTransactions.push(
            prisma.docexLog.deleteMany({
              where: {
                AND: [
                  { id: { not: existingLog.id } },
                  { docexId: Number(docexId) },
                  { departmentId: req.user.departmentId },
                ],
              },
            })
          );
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.delete({ where: { id: existingTracking.id } })
          );
        }
      } else if (receiverCode) {
        const user = await prisma.user.findUnique({
          where: { emp_code: receiverCode },
        });
        if (!user) return res.status(404).json({ message: "User not found" });

        const datelineValue = dateline
          ? new Date(dateline)
          : existingTracking?.dateline
          ? new Date(existingTracking.dateline)
          : null;

        let docexlogfileData = {
          docexlog_file: null,
          docexlog_type: null,
          docexlog_size: null,
        };

        if (req.file) {
          docexlogfileData = {
            docexlog_file: req.file.filename,
            docexlog_type: req.file.mimetype,
            docexlog_size: req.file.size,
          };
        } else if (Number(docstatusId) === 6) {
          if (existingTracking) {
            if (existingTracking.docstatusId === 5) {
              docexlogfileData = {
                docexlog_file: null,
                docexlog_type: null,
                docexlog_size: null,
              };
            } else if (existingTracking.docstatusId === 6) {
              docexlogfileData = {
                docexlog_file: existingTracking.docexlog_file ?? null,
                docexlog_type: existingTracking.docexlog_type ?? null,
                docexlog_size: existingTracking.docexlog_size ?? null,
              };
            }
          }
        } else if (Number(docstatusId) === 7) {
          docexlogfileData = {
            docexlog_file: existingTracking?.docexlog_file ?? null,
            docexlog_type: existingTracking?.docexlog_type ?? null,
            docexlog_size: existingTracking?.docexlog_size ?? null,
          };
        }

        logTransactions.push(
          prisma.docexLog.create({
            data: {
              docexId: Number(docexId),
              assignerCode: req.user.emp_code,
              receiverCode: user.emp_code,
              rankId: user.rankId ?? null,
              roleId: user.roleId ?? null,
              positionId: user.posId ?? null,
              docstatusId: Number(docstatusId),
              dateline: datelineValue,
              description: description ?? null,
              extype: Number(docex.extype) ?? null,
              departmentId: user.departmentId ?? null,
              divisionId: user.divisionId ?? null,
              departmentactive: existingTracking?.departmentactive ?? null,
              ...docexlogfileData,
            },
          })
        );
        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.update({
              where: { id: existingTracking.id },
              data: {
                assignerCode: req.user.emp_code,
                receiverCode: user.emp_code,
                docstatusId: Number(docstatusId),
                extype: Number(docex.extype) ?? null,
                dateline: datelineValue,
                description: description ?? null,
                ...docexlogfileData,
              },
            })
          );
        }
      } else {
        const allDivisions = [
          ...(Array.isArray(divisionId1) && divisionId1.length
            ? divisionId1.map((id) => ({
                id: Number(id),
                divisionactive: 1,
              }))
            : []),
          ...(Array.isArray(divisionId2) && divisionId2.length
            ? divisionId2.map((id) => ({
                id: Number(id),
                divisionactive: 2,
              }))
            : []),
        ];

        if (!allDivisions.length)
          return res
            .status(400)
            .json({ message: "At least one divisionId is required" });

        for (const { id: divisionId, divisionactive } of allDivisions) {
          const division = await prisma.division.findUnique({
            where: { id: divisionId },
            include: { users: true },
          });
          if (!division || !division.users.length)
            return res
              .status(404)
              .json({ message: `Division ${divisionId} not found` });

          const depUser = division.users.find(
            (u) => u.rankId === 1 && u.roleId === 7
          );
          if (!depUser)
            return res
              .status(404)
              .json({ message: `No matching user in division ${divisionId}` });

          const datelineValue = dateline
            ? new Date(dateline)
            : existingTracking?.dateline
            ? new Date(existingTracking.dateline)
            : null;
          logTransactions.push(
            prisma.docexLog.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.emp_code,
                receiverCode: depUser.emp_code,
                rankId: depUser.rankId ?? null,
                roleId: depUser.roleId ?? null,
                positionId: depUser.posId ?? null,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                departmentId: depUser.departmentId ?? null,
                departmentactive: existingTracking?.departmentactive ?? null,
                divisionId,
                divisionactive,
                docexlog_file: req.file?.filename ?? null,
                docexlog_type: req.file?.mimetype ?? null,
                docexlog_size: req.file?.size ?? null,
              },
            })
          );
          logTransactions.push(
            prisma.docexTracking.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.emp_code,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                departmentactive: existingTracking?.departmentactive ?? null,
                description: description ?? null,
                docexlog_file: req.file?.filename ?? null,
                docexlog_type: req.file?.mimetype ?? null,
                docexlog_size: req.file?.size ?? null,
              },
            })
          );
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.delete({ where: { id: existingTracking.id } })
          );
        }
      }

      const results = await prisma.$transaction(logTransactions);
      res
        .status(201)
        .json({ message: "Document assigned successfully", data: results });
    } catch (error) {
      console.error("Error assigning document:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
};

exports.division = async (req, res) => {
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
        unitId,
        officeId1 = [],
        officeId2 = [],
        docstatusId,
        description,
        dateline,
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

        const existingTracking = await prisma.docexTracking.findFirst({
          where: { docexId: Number(docexId), receiverCode: req.user.emp_code },
        });

        const datelineValue = dateline
          ? new Date(dateline)
          : existingTracking?.dateline
          ? new Date(existingTracking.dateline)
          : null;

        let docexlogfileData = {
          docexlog_file: null,
          docexlog_type: null,
          docexlog_size: null,
        };

        if (req.file) {
          docexlogfileData = {
            docexlog_file: req.file.filename,
            docexlog_type: req.file.mimetype,
            docexlog_size: req.file.size,
          };
        } else if (Number(docstatusId) === 6) {
          if (existingTracking) {
            if (existingTracking.docstatusId === 5) {
              docexlogfileData = {
                docexlog_file: null,
                docexlog_type: null,
                docexlog_size: null,
              };
            } else if (existingTracking.docstatusId === 6) {
              docexlogfileData = {
                docexlog_file: existingTracking.docexlog_file ?? null,
                docexlog_type: existingTracking.docexlog_type ?? null,
                docexlog_size: existingTracking.docexlog_size ?? null,
              };
            }
          }
        } else if (Number(docstatusId) === 7) {
          docexlogfileData = {
            docexlog_file: existingTracking?.docexlog_file ?? null,
            docexlog_type: existingTracking?.docexlog_type ?? null,
            docexlog_size: existingTracking?.docexlog_size ?? null,
          };
        }

        logTransactions.push(
          prisma.docexLog.create({
            data: {
              docexId: Number(docexId),
              assignerCode: req.user.emp_code,
              receiverCode: user.emp_code,
              rankId: Number(user.rankId),
              roleId: Number(user.roleId),
              positionId: Number(user.posId),
              docstatusId: Number(docstatusId),
              dateline: datelineValue,
              description: description ?? null,
              extype: Number(docex.extype) ?? null,
              departmentId: user.departmentId
                ? Number(user.departmentId)
                : null,
              divisionId: user.divisionId ? Number(user.divisionId) : null,
              officeId: user.officeId ?? null,
              unitId: user.unitId ?? null,
              departmentactive: Number(existingTracking.departmentactive),
              divisionactive: Number(existingTracking.divisionactive),
              ...docexlogfileData,
            },
          })
        );

        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.update({
              where: { id: existingTracking.id },
              data: {
                assignerCode: req.user.emp_code,
                receiverCode: user.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                ...docexlogfileData,
              },
            })
          );
        }
      } else if (unitId) {
        // 🔹 ถ้ามี receiverCode ใช้ข้อมูลนี้เท่านั้น
        const unit = await prisma.unit.findUnique({
          where: { id: Number(unitId) },
          include: { users: true },
        });

        if (!unit || !unit.users.length) {
          return res.status(404).json({ message: "unit or users not found" });
        }

        user = unit.users.find((u) => u.rankId === 1 && u.roleId === 9);

        if (!user) {
          return res.status(404).json({
            message:
              "No matching user found with specified rank, role, and position",
          });
        }

        const existingTracking = await prisma.docexTracking.findFirst({
          where: { docexId: Number(docexId), receiverCode: req.user.emp_code },
        });

        const datelineValue = dateline
          ? new Date(dateline)
          : existingTracking?.dateline
          ? new Date(existingTracking.dateline)
          : null;

        logTransactions.push(
          prisma.docexLog.create({
            data: {
              docexId: Number(docexId),
              assignerCode: req.user.emp_code,
              receiverCode: user.emp_code,
              rankId: Number(user.rankId),
              roleId: Number(user.roleId),
              positionId: Number(user.posId),
              docstatusId: Number(docstatusId),
              dateline: datelineValue,
              description: description ?? null,
              extype: Number(docex.extype) ?? null,
              departmentId: Number(user.departmentId),
              divisionId: Number(user.divisionId),
              unitId: Number(user.unitId),
              departmentactive: Number(existingTracking.departmentactive),
              divisionactive: Number(existingTracking.divisionactive),
              docexlog_file: req.file ? req.file.filename : null,
              docexlog_type: req.file ? req.file.mimetype : null,
              docexlog_size: req.file ? req.file.size : null,
            },
          })
        );

        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.update({
              where: { id: existingTracking.id },
              data: {
                assignerCode: req.user.emp_code,
                receiverCode: user.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                docexlog_file: req.file ? req.file.filename : null,
                docexlog_type: req.file ? req.file.mimetype : null,
                docexlog_size: req.file ? req.file.size : null,
              },
            })
          );
        }
      } else {
        const allOffices = [
          ...(Array.isArray(officeId1) && officeId1.length
            ? officeId1.map((id) => ({ id: Number(id), officeactive: 1 }))
            : []),
          ...(Array.isArray(officeId2) && officeId2.length
            ? officeId2.map((id) => ({ id: Number(id), officeactive: 2 }))
            : []),
        ];

        if (!allOffices.length) {
          return res
            .status(400)
            .json({ message: "At least one divisionId is required" });
        }

        // 🔹 เก็บ existingTracking ก่อน
        const existingTracking = await prisma.docexTracking.findFirst({
          where: { docexId: Number(docexId), receiverCode: req.user.emp_code },
        });

        // 🔹 วนลูปเพื่อเพิ่มข้อมูลก่อน
        for (const { id: officeId, officeactive } of allOffices) {
          const office = await prisma.office.findUnique({
            where: { id: officeId },
            include: { users: true },
          });

          if (!office || !office.users.length) {
            return res
              .status(404)
              .json({ message: `office ${officeId} or users not found` });
          }

          const depUser = office.users.find(
            (u) => u.rankId === 1 && u.roleId === 8
          );

          if (!depUser) {
            return res.status(404).json({
              message: `No matching user found in office ${officeId} with specified rank and role`,
            });
          }

          const datelineValue = dateline
            ? new Date(dateline)
            : existingTracking?.dateline
            ? new Date(existingTracking.dateline)
            : null;

          logTransactions.push(
            prisma.docexLog.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.emp_code,
                receiverCode: depUser.emp_code,
                rankId: Number(depUser.rankId),
                roleId: Number(depUser.roleId),
                positionId: Number(depUser.posId),
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                departmentId: Number(depUser.departmentId),
                departmentactive: Number(existingTracking.departmentactive),
                divisionId: Number(depUser.divisionId),
                divisionactive: Number(existingTracking.divisionactive),
                officeId,
                officeactive,
                docexlog_file: req.file ? req.file.filename : null,
                docexlog_type: req.file ? req.file.mimetype : null,
                docexlog_size: req.file ? req.file.size : null,
              },
            }),
            prisma.docexTracking.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.emp_code,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                departmentactive: Number(existingTracking.departmentactive),
                divisionactive: Number(existingTracking.divisionactive),
                officeactive,
                docexlog_file: req.file ? req.file.filename : null,
                docexlog_type: req.file ? req.file.mimetype : null,
                docexlog_size: req.file ? req.file.size : null,
              },
            })
          );
        }

        // 🔹 ลบ existingTracking **หลังจากเพิ่มข้อมูลเสร็จ**
        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.delete({
              where: { id: existingTracking.id },
            })
          );
        }
      }

      const results = await prisma.$transaction(logTransactions);

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

exports.office = async (req, res) => {
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
        unitId,
        docstatusId,
        description,
        dateline,
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

        const existingTracking = await prisma.docexTracking.findFirst({
          where: { docexId: Number(docexId), receiverCode: req.user.emp_code },
        });

        const datelineValue = dateline
          ? new Date(dateline)
          : existingTracking?.dateline
          ? new Date(existingTracking.dateline)
          : null;

        let docexlogfileData = {
          docexlog_file: null,
          docexlog_type: null,
          docexlog_size: null,
        };

        if (req.file) {
          docexlogfileData = {
            docexlog_file: req.file.filename,
            docexlog_type: req.file.mimetype,
            docexlog_size: req.file.size,
          };
        } else if (Number(docstatusId) === 6) {
          if (existingTracking) {
            if (existingTracking.docstatusId === 5) {
              docexlogfileData = {
                docexlog_file: null,
                docexlog_type: null,
                docexlog_size: null,
              };
            } else if (existingTracking.docstatusId === 6) {
              docexlogfileData = {
                docexlog_file: existingTracking.docexlog_file ?? null,
                docexlog_type: existingTracking.docexlog_type ?? null,
                docexlog_size: existingTracking.docexlog_size ?? null,
              };
            }
          }
        } else if (Number(docstatusId) === 7) {
          docexlogfileData = {
            docexlog_file: existingTracking?.docexlog_file ?? null,
            docexlog_type: existingTracking?.docexlog_type ?? null,
            docexlog_size: existingTracking?.docexlog_size ?? null,
          };
        }

        logTransactions.push(
          prisma.docexLog.create({
            data: {
              docexId: Number(docexId),
              assignerCode: req.user.emp_code,
              receiverCode: user.emp_code,
              rankId: Number(user.rankId),
              roleId: Number(user.roleId),
              positionId: Number(user.posId),
              docstatusId: Number(docstatusId),
              dateline: datelineValue,
              description: description ?? null,
              extype: Number(docex.extype) ?? null,
              departmentId: user.departmentId
                ? Number(user.departmentId)
                : null,
              divisionId: user.divisionId ? Number(user.divisionId) : null,
              officeId: user.officeId ? Number(user.officeId) : null,
              unitId: user.unitId ? Number(user.unitId) : null,
              departmentactive: Number(existingTracking.departmentactive),
              divisionactive: Number(existingTracking.divisionactive),
              officeactive: Number(existingTracking.officeactive),
              ...docexlogfileData,
              // ...(user.roleId === 8 || (docstatusId === 7 && user.roleId === 8)
              //   ? { officeId: Number(user.officeId) }
              //   : {}),
            },
          })
        );

        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.update({
              where: { id: existingTracking.id },
              data: {
                assignerCode: req.user.emp_code,
                receiverCode: user.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                ...docexlogfileData,
              },
            })
          );
        }
      } else {
        // 🔹 ถ้ามี receiverCode ใช้ข้อมูลนี้เท่านั้น
        const unit = await prisma.unit.findUnique({
          where: { id: Number(unitId) },
          include: { users: true },
        });

        if (!unit || !unit.users.length) {
          return res.status(404).json({ message: "unit or users not found" });
        }

        user = unit.users.find((u) => u.rankId === 1 && u.roleId === 9);

        if (!user) {
          return res.status(404).json({
            message:
              "No matching user found with specified rank, role, and position",
          });
        }

        const existingTracking = await prisma.docexTracking.findFirst({
          where: { docexId: Number(docexId), receiverCode: req.user.emp_code },
        });

        const datelineValue = dateline
          ? new Date(dateline)
          : existingTracking?.dateline
          ? new Date(existingTracking.dateline)
          : null;

        logTransactions.push(
          prisma.docexLog.create({
            data: {
              docexId: Number(docexId),
              assignerCode: req.user.emp_code,
              receiverCode: user.emp_code,
              rankId: Number(user.rankId),
              roleId: Number(user.roleId),
              positionId: Number(user.posId),
              docstatusId: Number(docstatusId),
              dateline: datelineValue,
              description: description ?? null,
              extype: Number(docex.extype) ?? null,
              departmentId: Number(user.departmentId),
              divisionId: Number(user.divisionId),
              unitId: Number(user.unitId),
              departmentactive: Number(existingTracking.departmentactive),
              divisionactive: Number(existingTracking.divisionactive),
              officeactive: Number(existingTracking.officeactive),
              docexlog_file: req.file ? req.file.filename : null,
              docexlog_type: req.file ? req.file.mimetype : null,
              docexlog_size: req.file ? req.file.size : null,
            },
          })
        );

        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.update({
              where: { id: existingTracking.id },
              data: {
                assignerCode: req.user.emp_code,
                receiverCode: user.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                docexlog_file: req.file ? req.file.filename : null,
                docexlog_type: req.file ? req.file.mimetype : null,
                docexlog_size: req.file ? req.file.size : null,
              },
            })
          );
        }
      }

      const results = await prisma.$transaction(logTransactions);

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

exports.unit = async (req, res) => {
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
      const { docexId, receiverCode, docstatusId, description, dateline } =
        req.body;

      if (!docexId) {
        return res.status(400).json({ message: "docexId is required" });
      }

      let logTransactions = [];
      const docex = await prisma.docExternal.findUnique({
        where: {
          id: Number(docexId),
        },
      });

      const user = await prisma.user.findUnique({
        where: { emp_code: receiverCode },
      });

      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found with the provided receiverCode" });
      }

      const existingTracking = await prisma.docexTracking.findFirst({
        where: { docexId: Number(docexId), receiverCode: req.user.emp_code },
      });

      const datelineValue = dateline
        ? new Date(dateline)
        : existingTracking?.dateline
        ? new Date(existingTracking.dateline)
        : null;

      let docexlogfileData = {
        docexlog_file: null,
        docexlog_type: null,
        docexlog_size: null,
      };

      if (req.file) {
        docexlogfileData = {
          docexlog_file: req.file.filename,
          docexlog_type: req.file.mimetype,
          docexlog_size: req.file.size,
        };
      } else if (Number(docstatusId) === 6) {
        if (existingTracking) {
          if (existingTracking.docstatusId === 5) {
            docexlogfileData = {
              docexlog_file: null,
              docexlog_type: null,
              docexlog_size: null,
            };
          } else if (existingTracking.docstatusId === 6) {
            docexlogfileData = {
              docexlog_file: existingTracking.docexlog_file ?? null,
              docexlog_type: existingTracking.docexlog_type ?? null,
              docexlog_size: existingTracking.docexlog_size ?? null,
            };
          }
        }
      } else if (Number(docstatusId) === 7) {
        docexlogfileData = {
          docexlog_file: existingTracking?.docexlog_file ?? null,
          docexlog_type: existingTracking?.docexlog_type ?? null,
          docexlog_size: existingTracking?.docexlog_size ?? null,
        };
      }

      logTransactions.push(
        prisma.docexLog.create({
          data: {
            docexId: Number(docexId),
            assignerCode: req.user.emp_code,
            receiverCode: user.emp_code,
            rankId: user.rankId ? Number(user.rankId) : null,
            roleId: user.roleId ? Number(user.roleId) : null,
            positionId: user.posId ? Number(user.posId) : null,
            docstatusId: Number(docstatusId),
            dateline: datelineValue,
            description: description ?? null,
            extype: Number(docex.extype) ?? null,
            departmentId: user.departmentId ? Number(user.departmentId) : null,
            divisionId: user.divisionId ? Number(user.divisionId) : null,
            officeId: user.officeId ? Number(user.officeId) : null,
            unitId: user.unitId ? Number(user.unitId) : null,
            departmentactive: existingTracking?.departmentactive ?? null,
            divisionactive: existingTracking?.divisionactive ?? null,
            officeactive: existingTracking?.officeactive ?? null,
            ...docexlogfileData,
            // ...(user.roleId === 9 || (docstatusId === 7 && user.roleId === 9)
            //   ? { unitId: user.unitId ? Number(user.unitId) : null }
            //   : {}),
          },
        })
      );

      if (existingTracking) {
        logTransactions.push(
          prisma.docexTracking.update({
            where: { id: existingTracking.id },
            data: {
              assignerCode: req.user.emp_code,
              receiverCode: user.emp_code,
              docstatusId: Number(docstatusId),
              dateline: datelineValue,
              description: description ?? null,
              extype: Number(docex.extype) ?? null,
              ...docexlogfileData,
            },
          })
        );
      }

      const results = await prisma.$transaction(logTransactions);

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

exports.staff = async (req, res) => {
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
      const { docexId, receiverCode, docstatusId, description, dateline } =
        req.body;

      if (!docexId) {
        return res.status(400).json({ message: "docexId is required" });
      }

      let logTransactions = [];
      const docex = await prisma.docExternal.findUnique({
        where: {
          id: Number(docexId),
        },
      });

      const user = await prisma.user.findUnique({
        where: { emp_code: receiverCode },
      });

      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found with the provided receiverCode" });
      }

      const existingTracking = await prisma.docexTracking.findFirst({
        where: { docexId: Number(docexId), receiverCode: req.user.emp_code },
      });

      const datelineValue = dateline
        ? new Date(dateline)
        : existingTracking?.dateline
        ? new Date(existingTracking.dateline)
        : null;

      let docexlogfileData = {
        docexlog_file: null,
        docexlog_type: null,
        docexlog_size: null,
      };

      if (req.file) {
        docexlogfileData = {
          docexlog_file: req.file.filename,
          docexlog_type: req.file.mimetype,
          docexlog_size: req.file.size,
        };
      } else if (Number(docstatusId) === 6) {
        if (existingTracking) {
          if (existingTracking.docstatusId === 5) {
            docexlogfileData = {
              docexlog_file: null,
              docexlog_type: null,
              docexlog_size: null,
            };
          } else if (existingTracking.docstatusId === 6) {
            docexlogfileData = {
              docexlog_file: existingTracking.docexlog_file ?? null,
              docexlog_type: existingTracking.docexlog_type ?? null,
              docexlog_size: existingTracking.docexlog_size ?? null,
            };
          }
        }
      } else if (Number(docstatusId) === 7) {
        docexlogfileData = {
          docexlog_file: existingTracking?.docexlog_file ?? null,
          docexlog_type: existingTracking?.docexlog_type ?? null,
          docexlog_size: existingTracking?.docexlog_size ?? null,
        };
      }

      logTransactions.push(
        prisma.docexLog.create({
          data: {
            docexId: Number(docexId),
            assignerCode: req.user.emp_code,
            receiverCode: user.emp_code,
            rankId: user.rankId ? Number(user.rankId) : null,
            roleId: user.roleId ? Number(user.roleId) : null,
            positionId: user.posId ? Number(user.posId) : null,
            docstatusId: Number(docstatusId),
            dateline: datelineValue,
            description: description ?? null,
            extype: Number(docex.extype) ?? null,
            departmentId: user.departmentId ? Number(user.departmentId) : null,
            divisionId: user.divisionId ? Number(user.divisionId) : null,
            officeId: user.officeId ? Number(user.officeId) : null,
            unitId: user.unitId ? Number(user.unitId) : null,
            departmentactive: existingTracking?.departmentactive ?? null,
            divisionactive: existingTracking?.divisionactive ?? null,
            officeactive: existingTracking?.officeactive ?? null,
            ...docexlogfileData,
          },
        })
      );

      if (existingTracking) {
        logTransactions.push(
          prisma.docexTracking.update({
            where: { id: existingTracking.id },
            data: {
              assignerCode: req.user.emp_code,
              receiverCode: user.emp_code,
              docstatusId: Number(docstatusId),
              dateline: datelineValue,
              description: description ?? null,
              extype: Number(docex.extype) ?? null,
              ...docexlogfileData,
            },
          })
        );
      }

      const results = await prisma.$transaction(logTransactions);

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
