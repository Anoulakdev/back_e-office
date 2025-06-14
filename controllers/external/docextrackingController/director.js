const fs = require("fs");
const prisma = require("../../../prisma/prisma");
const generateDocumentNumber = require("./generateDocumentNumber");
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
        where: { docexId: Number(docexId), receiverCode: req.user.username },
      });

      const docex = await prisma.docExternal.findUnique({
        where: {
          id: Number(docexId),
        },
      });

      if (!receiverCode && !departmentId1.length && !departmentId2.length) {
        logTransactions.push(
          prisma.docexLog.create({
            data: {
              docexId: Number(docexId),
              assignerCode: req.user.username,
              docstatusId: Number(docstatusId),
              description: description ?? null,
              viewed: true,
              extype: Number(docex.extype) ?? null,
              docexlog_original: req.file
                ? Buffer.from(req.file.originalname, "latin1").toString("utf8")
                : null,
              docexlog_file: req.file ? req.file.filename : null,
              docexlog_type: req.file ? req.file.mimetype : null,
              docexlog_size: req.file ? req.file.size : null,
            },
          })
        );

        if (Number(docex.extype) === 2 && Number(docstatusId) === 9) {
          const docNumber = await generateDocumentNumber();
          logTransactions.push(
            prisma.docExport.create({
              data: {
                docexId: Number(docexId),
                signatorCode: req.user.username,
                export_no: docNumber,
              },
            })
          );
        }

        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.delete({ where: { id: existingTracking.id } })
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

          let docexlogfileData = {
            docexlog_original: null,
            docexlog_file: null,
            docexlog_type: null,
            docexlog_size: null,
          };

          if (req.file) {
            docexlogfileData = {
              docexlog_original: Buffer.from(
                req.file.originalname,
                "latin1"
              ).toString("utf8"),
              docexlog_file: req.file.filename,
              docexlog_type: req.file.mimetype,
              docexlog_size: req.file.size,
            };
          } else if (Number(docstatusId) === 6) {
            if (existingTracking) {
              if (existingTracking.docstatusId === 5) {
                docexlogfileData = {
                  docexlog_original: null,
                  docexlog_file: null,
                  docexlog_type: null,
                  docexlog_size: null,
                };
              } else if (existingTracking.docstatusId === 6) {
                docexlogfileData = {
                  docexlog_original: existingTracking.docexlog_original ?? null,
                  docexlog_file: existingTracking.docexlog_file ?? null,
                  docexlog_type: existingTracking.docexlog_type ?? null,
                  docexlog_size: existingTracking.docexlog_size ?? null,
                };
              }
            }
          } else if (Number(docstatusId) === 7 || Number(docstatusId) === 10) {
            docexlogfileData = {
              docexlog_original: existingTracking?.docexlog_original ?? null,
              docexlog_file: existingTracking?.docexlog_file ?? null,
              docexlog_type: existingTracking?.docexlog_type ?? null,
              docexlog_size: existingTracking?.docexlog_size ?? null,
            };
          }

          const updateData = {};
          if (priorityId) {
            updateData.priorityId = Number(priorityId);
            logTransactions.push(
              prisma.docExternal.update({
                where: { id: Number(docexId) },
                data: updateData,
              })
            );
          }

          logTransactions.push(
            prisma.docexLog.create({
              data: {
                docexId: Number(docexId),
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
                extype: Number(docex.extype) ?? null,
                ...docexlogfileData,
              },
            }),
            prisma.docexTracking.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.username,
                receiverCode: user.username,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                ...docexlogfileData,
              },
            })
          );
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.delete({
              where: { id: existingTracking.id },
            })
          );
        }
      } else if (
        !receiverCode &&
        departmentId1.length &&
        departmentId2.length
      ) {
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
            logTransactions.push(
              prisma.docExternal.update({
                where: { id: Number(docexId) },
                data: updateData,
              })
            );
          }

          logTransactions.push(
            prisma.docexLog.create({
              data: {
                docexId: Number(docexId),
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
                extype: Number(docex.extype) ?? null,
                departmentId,
                departmentactive,
                divisionId: depUser.divisionId
                  ? Number(depUser.divisionId)
                  : null,
                docexlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
                docexlog_file: req.file ? req.file.filename : null,
                docexlog_type: req.file ? req.file.mimetype : null,
                docexlog_size: req.file ? req.file.size : null,
              },
            }),
            prisma.docexTracking.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                departmentactive,
                docexlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
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

          let docexlogfileData = {
            docexlog_original: null,
            docexlog_file: null,
            docexlog_type: null,
            docexlog_size: null,
          };

          if (req.file) {
            docexlogfileData = {
              docexlog_original: Buffer.from(
                req.file.originalname,
                "latin1"
              ).toString("utf8"),
              docexlog_file: req.file.filename,
              docexlog_type: req.file.mimetype,
              docexlog_size: req.file.size,
            };
          } else if (Number(docstatusId) === 6) {
            if (existingTracking) {
              if (existingTracking.docstatusId === 5) {
                docexlogfileData = {
                  docexlog_original: null,
                  docexlog_file: null,
                  docexlog_type: null,
                  docexlog_size: null,
                };
              } else if (existingTracking.docstatusId === 6) {
                docexlogfileData = {
                  docexlog_original: existingTracking.docexlog_original ?? null,
                  docexlog_file: existingTracking.docexlog_file ?? null,
                  docexlog_type: existingTracking.docexlog_type ?? null,
                  docexlog_size: existingTracking.docexlog_size ?? null,
                };
              }
            }
          } else if (Number(docstatusId) === 7 || Number(docstatusId) === 10) {
            docexlogfileData = {
              docexlog_original: existingTracking?.docexlog_original ?? null,
              docexlog_file: existingTracking?.docexlog_file ?? null,
              docexlog_type: existingTracking?.docexlog_type ?? null,
              docexlog_size: existingTracking?.docexlog_size ?? null,
            };
          }

          const updateData = {};
          if (priorityId) {
            updateData.priorityId = Number(priorityId);
            logTransactions.push(
              prisma.docExternal.update({
                where: { id: Number(docexId) },
                data: updateData,
              })
            );
          }

          logTransactions.push(
            prisma.docexLog.create({
              data: {
                docexId: Number(docexId),
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
                extype: Number(docex.extype) ?? null,
                ...docexlogfileData,
              },
            }),
            prisma.docexTracking.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.username,
                receiverCode: user.username,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                ...docexlogfileData,
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
            prisma.docexLog.create({
              data: {
                docexId: Number(docexId),
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
                extype: Number(docex.extype) ?? null,
                departmentId,
                departmentactive,
                divisionId: depUser.divisionId
                  ? Number(depUser.divisionId)
                  : null,
                docexlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
                docexlog_file: req.file ? req.file.filename : null,
                docexlog_type: req.file ? req.file.mimetype : null,
                docexlog_size: req.file ? req.file.size : null,
              },
            }),
            prisma.docexTracking.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                departmentactive,
                docexlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
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
