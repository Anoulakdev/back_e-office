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
        docdtId,
        receiverCode,
        departmentId1 = [],
        departmentId2 = [],
        docstatusId,
        description,
        priorityId,
        dateline,
      } = req.body;

      if (!docdtId) {
        return res.status(400).json({ message: "docdtId is required" });
      }

      let logTransactions = [];
      const existingTracking = await prisma.docdtTracking.findFirst({
        where: { docdtId: Number(docdtId), receiverCode: req.user.username },
      });

      const docdt = await prisma.docDirector.findUnique({
        where: {
          id: Number(docdtId),
        },
      });

      if (!receiverCode && !departmentId1.length && !departmentId2.length) {
        logTransactions.push(
          prisma.docdtLog.create({
            data: {
              docdtId: Number(docdtId),
              assignerCode: req.user.username,
              docstatusId: Number(docstatusId),
              description: description ?? null,
              viewed: true,
              docdtlog_original: req.file
                ? Buffer.from(req.file.originalname, "latin1").toString("utf8")
                : null,
              docdtlog_file: req.file ? req.file.filename : null,
              docdtlog_type: req.file ? req.file.mimetype : null,
              docdtlog_size: req.file ? req.file.size : null,
            },
          })
        );
        if (existingTracking) {
          logTransactions.push(
            prisma.docdtTracking.delete({ where: { id: existingTracking.id } })
          );
        }
      } else if (
        receiverCode &&
        !departmentId1.length &&
        !departmentId2.length
      ) {
        if (!Array.isArray(receiverCode) || receiverCode.length === 0) {
          return res
            .status(400)
            .json({ message: "receiverCode must be a non-empty array" });
        }

        for (const receiverC of receiverCode) {
          const user = await prisma.user.findUnique({
            where: { username: receiverC },
            include: {
              employee: true,
            },
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

          let docdtlogfileData = {
            docdtlog_original: null,
            docdtlog_file: null,
            docdtlog_type: null,
            docdtlog_size: null,
          };

          if (req.file) {
            docdtlogfileData = {
              docdtlog_original: Buffer.from(
                req.file.originalname,
                "latin1"
              ).toString("utf8"),
              docdtlog_file: req.file.filename,
              docdtlog_type: req.file.mimetype,
              docdtlog_size: req.file.size,
            };
          } else if (Number(docstatusId) === 6) {
            if (existingTracking) {
              if (existingTracking.docstatusId === 5) {
                docdtlogfileData = {
                  docdtlog_original: null,
                  docdtlog_file: null,
                  docdtlog_type: null,
                  docdtlog_size: null,
                };
              } else if (existingTracking.docstatusId === 6) {
                docdtlogfileData = {
                  docdtlog_original: existingTracking.docdtlog_original ?? null,
                  docdtlog_file: existingTracking.docdtlog_file ?? null,
                  docdtlog_type: existingTracking.docdtlog_type ?? null,
                  docdtlog_size: existingTracking.docdtlog_size ?? null,
                };
              }
            }
          } else if (Number(docstatusId) === 7) {
            docdtlogfileData = {
              docdtlog_original: existingTracking?.docdtlog_original ?? null,
              docdtlog_file: existingTracking?.docdtlog_file ?? null,
              docdtlog_type: existingTracking?.docdtlog_type ?? null,
              docdtlog_size: existingTracking?.docdtlog_size ?? null,
            };
          }

          logTransactions.push(
            prisma.docDirector.update({
              where: { id: Number(docdtId) },
              data: updateData,
            }),
            prisma.docdtLog.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: user.username,
                rankId: user.rankId ? Number(user.rankId) : null,
                roleId: user.roleId ? Number(user.roleId) : null,
                positionId: user.employee.posId
                  ? Number(user.employee.posId)
                  : null,
                docstatusId: Number(docstatusId),
                departmentId: user.employee.departmentId
                  ? Number(user.employee.departmentId)
                  : null,
                divisionId: user.employee.divisionId
                  ? Number(user.employee.divisionId)
                  : null,
                dateline: datelineValue,
                description: description ?? null,
                ...docdtlogfileData,
              },
            }),
            prisma.docdtTracking.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: user.username,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                ...docdtlogfileData,
              },
            })
          );
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docdtTracking.delete({
              where: { id: existingTracking.id },
            })
          );
        }
      } else if (
        !receiverCode &&
        departmentId1.length &&
        departmentId2.length
      ) {
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
            include: {
              employees: {
                include: {
                  user: {
                    where: {
                      roleId: 6,
                    },
                    select: {
                      rankId: true,
                      roleId: true,
                    },
                  },
                },
              },
            },
          });

          const departmentWithUser = {
            ...department,
            employees: department?.employees?.length
              ? department.employees.map((employee) => ({
                  ...employee,
                  user: employee.user[0] || null,
                }))
              : [],
          };

          if (!departmentWithUser || !departmentWithUser.employees.length) {
            return res.status(404).json({
              message: `Department ${departmentId} or employees not found`,
            });
          }

          let depUser = null;
          const rankPriority = [1, 2, 3, 4, 5, 6, 7]; // ปรับลำดับความสำคัญตามต้องการ

          for (const rankId of rankPriority) {
            depUser = departmentWithUser.employees.find(
              (u) => u.user?.rankId === rankId && u.user?.roleId === 6
            );
            if (depUser) break;
          }

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
            prisma.docDirector.update({
              where: { id: Number(docdtId) },
              data: updateData,
            }),
            prisma.docdtLog.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                rankId: depUser.user?.rankId
                  ? Number(depUser.user?.rankId)
                  : null,
                roleId: depUser.user?.roleId
                  ? Number(depUser.user?.roleId)
                  : null,
                positionId: depUser.posId ? Number(depUser.posId) : null,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                departmentId,
                departmentactive,
                divisionId: depUser.divisionId
                  ? Number(depUser.divisionId)
                  : null,
                docdtlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
                docdtlog_file: req.file ? req.file.filename : null,
                docdtlog_type: req.file ? req.file.mimetype : null,
                docdtlog_size: req.file ? req.file.size : null,
              },
            }),
            prisma.docdtTracking.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                departmentactive,
                docdtlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
                docdtlog_file: req.file ? req.file.filename : null,
                docdtlog_type: req.file ? req.file.mimetype : null,
                docdtlog_size: req.file ? req.file.size : null,
              },
            })
          );
        }

        // 🔹 ลบ existingTracking **หลังจากเพิ่มข้อมูลเสร็จ**
        if (existingTracking) {
          logTransactions.push(
            prisma.docdtTracking.delete({
              where: { id: existingTracking.id },
            })
          );
        }
      } else if (receiverCode && departmentId1.length && departmentId2.length) {
        if (!Array.isArray(receiverCode) || receiverCode.length === 0) {
          return res
            .status(400)
            .json({ message: "receiverCode must be a non-empty array" });
        }
        for (const receiverC of receiverCode) {
          const user = await prisma.user.findUnique({
            where: { username: receiverC },
            include: {
              employee: true,
            },
          });

          if (!user) return res.status(404).json({ message: "User not found" });

          const datelineValue = dateline
            ? new Date(dateline)
            : existingTracking?.dateline
            ? new Date(existingTracking.dateline)
            : null;

          let docdtlogfileData = {
            docdtlog_original: null,
            docdtlog_file: null,
            docdtlog_type: null,
            docdtlog_size: null,
          };

          if (req.file) {
            docdtlogfileData = {
              docdtlog_original: Buffer.from(
                req.file.originalname,
                "latin1"
              ).toString("utf8"),
              docdtlog_file: req.file.filename,
              docdtlog_type: req.file.mimetype,
              docdtlog_size: req.file.size,
            };
          } else if (Number(docstatusId) === 6) {
            if (existingTracking) {
              if (existingTracking.docstatusId === 5) {
                docdtlogfileData = {
                  docdtlog_original: null,
                  docdtlog_file: null,
                  docdtlog_type: null,
                  docdtlog_size: null,
                };
              } else if (existingTracking.docstatusId === 6) {
                docdtlogfileData = {
                  docdtlog_original: existingTracking.docdtlog_original ?? null,
                  docdtlog_file: existingTracking.docdtlog_file ?? null,
                  docdtlog_type: existingTracking.docdtlog_type ?? null,
                  docdtlog_size: existingTracking.docdtlog_size ?? null,
                };
              }
            }
          } else if (Number(docstatusId) === 7 || Number(docstatusId) === 10) {
            docdtlogfileData = {
              docdtlog_original: existingTracking?.docdtlog_original ?? null,
              docdtlog_file: existingTracking?.docdtlog_file ?? null,
              docdtlog_type: existingTracking?.docdtlog_type ?? null,
              docdtlog_size: existingTracking?.docdtlog_size ?? null,
            };
          }

          const updateData = {};
          if (priorityId) {
            updateData.priorityId = Number(priorityId);
            logTransactions.push(
              prisma.docDirector.update({
                where: { id: Number(docdtId) },
                data: updateData,
              })
            );
          }

          logTransactions.push(
            prisma.docdtLog.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: user.username,
                rankId: user.rankId ? Number(user.rankId) : null,
                roleId: user.roleId ? Number(user.roleId) : null,
                positionId: user.employee.posId
                  ? Number(user.employee.posId)
                  : null,
                docstatusId: Number(docstatusId),
                departmentId: user.employee.departmentId
                  ? Number(user.employee.departmentId)
                  : null,
                divisionId: user.employee.divisionId
                  ? Number(user.employee.divisionId)
                  : null,
                dateline: datelineValue,
                description: description ?? null,
                ...docdtlogfileData,
              },
            }),
            prisma.docdtTracking.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: user.username,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                ...docdtlogfileData,
              },
            })
          );
        }

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
            include: {
              employees: {
                include: {
                  user: {
                    where: {
                      roleId: 6,
                    },
                    select: {
                      rankId: true,
                      roleId: true,
                    },
                  },
                },
              },
            },
          });

          const departmentWithUser = {
            ...department,
            employees: department?.employees?.length
              ? department.employees.map((employee) => ({
                  ...employee,
                  user: employee.user[0] || null,
                }))
              : [],
          };

          if (!departmentWithUser || !departmentWithUser.employees.length) {
            return res.status(404).json({
              message: `Department ${departmentId} or employees not found`,
            });
          }

          let depUser = null;
          const rankPriority = [1, 2, 3, 4, 5, 6, 7]; // ปรับลำดับความสำคัญตามต้องการ

          for (const rankId of rankPriority) {
            depUser = departmentWithUser.employees.find(
              (u) => u.user?.rankId === rankId && u.user?.roleId === 6
            );
            if (depUser) break;
          }

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
            prisma.docdtLog.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                rankId: depUser.user?.rankId
                  ? Number(depUser.user?.rankId)
                  : null,
                roleId: depUser.user?.roleId
                  ? Number(depUser.user?.roleId)
                  : null,
                positionId: depUser.posId ? Number(depUser.posId) : null,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                departmentId,
                departmentactive,
                divisionId: depUser.divisionId
                  ? Number(depUser.divisionId)
                  : null,
                docdtlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
                docdtlog_file: req.file ? req.file.filename : null,
                docdtlog_type: req.file ? req.file.mimetype : null,
                docdtlog_size: req.file ? req.file.size : null,
              },
            }),
            prisma.docdtTracking.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                departmentactive,
                docdtlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
                docdtlog_file: req.file ? req.file.filename : null,
                docdtlog_type: req.file ? req.file.mimetype : null,
                docdtlog_size: req.file ? req.file.size : null,
              },
            })
          );
        }

        // 🔹 ลบ existingTracking **หลังจากเพิ่มข้อมูลเสร็จ**
        if (existingTracking) {
          logTransactions.push(
            prisma.docdtTracking.delete({
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
