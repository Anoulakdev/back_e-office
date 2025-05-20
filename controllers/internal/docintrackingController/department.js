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

const upload = multer({ storage: storage }).single("docinlog_file");

module.exports = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      const errorMsg =
        err instanceof multer.MulterError ? "Multer error" : "Unknown error";
      return res.status(500).json({ message: errorMsg, error: err.message });
    }

    try {
      const {
        docinId,
        receiverCode,
        divisionId,
        departmentId,
        docstatusId,
        description,
        dateline,
      } = req.body;

      if (!docinId)
        return res.status(400).json({ message: "docinId is required" });

      let logTransactions = [];

      const existingTracking = await prisma.docinTracking.findFirst({
        where: { docinId: Number(docinId), receiverCode: req.user.username },
      });

      const docin = await prisma.docInternal.findUnique({
        where: {
          id: Number(docinId),
        },
      });

      if (!receiverCode && !divisionId && !departmentId) {
        const existingLog = await prisma.docinLog.findFirst({
          where: { docinId: Number(docinId), receiverCode: req.user.username },
          orderBy: { id: "desc" },
          take: 1,
        });

        if (existingLog) {
          logTransactions.push(
            prisma.docinLog.update({
              where: { id: existingLog.id },
              data: { docstatusId: Number(docstatusId), description },
            })
          );
          if (docstatusId === 4) {
            logTransactions.push(
              prisma.docinLog.deleteMany({
                where: {
                  AND: [
                    { id: { not: existingLog.id } },
                    { docinId: Number(docinId) },
                    { departmentId: req.user.employee.departmentId },
                  ],
                },
              })
            );
          }
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docinTracking.delete({ where: { id: existingTracking.id } })
          );
        }
      } else if (receiverCode && !departmentId && !divisionId) {
        const user = await prisma.user.findUnique({
          where: { username: receiverCode },
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

        let docinlogfileData = {
          docinlog_original: null,
          docinlog_file: null,
          docinlog_type: null,
          docinlog_size: null,
        };

        if (req.file) {
          docinlogfileData = {
            docinlog_original: Buffer.from(
              req.file.originalname,
              "latin1"
            ).toString("utf8"),
            docinlog_file: req.file.filename,
            docinlog_type: req.file.mimetype,
            docinlog_size: req.file.size,
          };
        } else if (Number(docstatusId) === 6) {
          if (existingTracking) {
            if (existingTracking.docstatusId === 5) {
              docinlogfileData = {
                docinlog_original: null,
                docinlog_file: null,
                docinlog_type: null,
                docinlog_size: null,
              };
            } else if (existingTracking.docstatusId === 6) {
              docinlogfileData = {
                docinlog_original: existingTracking.docinlog_original ?? null,
                docinlog_file: existingTracking.docinlog_file ?? null,
                docinlog_type: existingTracking.docinlog_type ?? null,
                docinlog_size: existingTracking.docinlog_size ?? null,
              };
            }
          }
        } else if (Number(docstatusId) === 7) {
          docinlogfileData = {
            docinlog_original: existingTracking?.docinlog_original ?? null,
            docinlog_file: existingTracking?.docinlog_file ?? null,
            docinlog_type: existingTracking?.docinlog_type ?? null,
            docinlog_size: existingTracking?.docinlog_size ?? null,
          };
        }

        logTransactions.push(
          prisma.docinLog.create({
            data: {
              docinId: Number(docinId),
              assignerCode: req.user.username,
              receiverCode: user.username,
              rankId: user.rankId ? Number(user.rankId) : null,
              roleId: user.roleId ? Number(user.roleId) : null,
              positionId: user.employee.posId
                ? Number(user.employee.posId)
                : null,
              docstatusId: Number(docstatusId),
              dateline: datelineValue,
              description: description ?? null,
              departmentId: user.employee.departmentId
                ? Number(user.employee.departmentId)
                : null,
              divisionId: user.employee.divisionId
                ? Number(user.employee.divisionId)
                : null,
              ...docinlogfileData,
            },
          })
        );
        if (existingTracking) {
          logTransactions.push(
            prisma.docinTracking.update({
              where: { id: existingTracking.id },
              data: {
                assignerCode: req.user.username,
                receiverCode: user.username,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                viewed: false,
                ...docinlogfileData,
              },
            })
          );
        }
      } else if (divisionId && !receiverCode && !departmentId) {
        const division = await prisma.division.findUnique({
          where: { id: Number(divisionId) },
          include: {
            employees: {
              include: {
                user: {
                  where: {
                    roleId: 7,
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

        const divisionWithUser = {
          ...division,
          employees: division?.employees?.length
            ? division.employees.map((employee) => ({
                ...employee,
                user: employee.user[0] || null,
              }))
            : [],
        };

        if (!divisionWithUser || !divisionWithUser.employees.length) {
          return res.status(404).json({
            message: `division ${divisionId} or employees not found`,
          });
        }

        const depUser = divisionWithUser.employees.find(
          (u) => u.user?.rankId === 1 && u.user?.roleId === 7
        );

        if (!depUser) {
          return res.status(404).json({
            message: `No matching user found in division ${divisionId} with specified rank and role`,
          });
        }

        const datelineValue = dateline
          ? new Date(dateline)
          : existingTracking?.dateline
          ? new Date(existingTracking.dateline)
          : null;

        logTransactions.push(
          prisma.docinLog.create({
            data: {
              docinId: Number(docinId),
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
              departmentId: depUser.departmentId
                ? Number(depUser.departmentId)
                : null,
              divisionId: depUser.divisionId
                ? Number(depUser.divisionId)
                : null,
              docinlog_original: req.file
                ? Buffer.from(req.file.originalname, "latin1").toString("utf8")
                : null,
              docinlog_file: req.file ? req.file.filename : null,
              docinlog_type: req.file ? req.file.mimetype : null,
              docinlog_size: req.file ? req.file.size : null,
            },
          })
        );

        if (existingTracking) {
          logTransactions.push(
            prisma.docinTracking.update({
              where: { id: existingTracking.id },
              data: {
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                viewed: false,
                docinlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
                docinlog_file: req.file ? req.file.filename : null,
                docinlog_type: req.file ? req.file.mimetype : null,
                docinlog_size: req.file ? req.file.size : null,
              },
            })
          );
        }
      } else if (departmentId && !receiverCode && !divisionId) {
        const allDepartments = Array.isArray(departmentId)
          ? departmentId.map((id) => Number(id))
          : [Number(departmentId)];

        if (!allDepartments.length) {
          return res
            .status(400)
            .json({ message: "At least one departmentId is required." });
        }

        for (const departmentId of allDepartments) {
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
              message: `department ${departmentId} or employees not found`,
            });
          }

          const depUser = departmentWithUser.employees.find(
            (u) => u.user?.rankId === 1 && u.user?.roleId === 6
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
            prisma.docinLog.create({
              data: {
                docinId: Number(docinId),
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
                departmentId: depUser.departmentId
                  ? Number(depUser.departmentId)
                  : null,
                divisionId: depUser.divisionId
                  ? Number(depUser.divisionId)
                  : null,
                docinlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
                docinlog_file: req.file?.filename ?? null,
                docinlog_type: req.file?.mimetype ?? null,
                docinlog_size: req.file?.size ?? null,
              },
            })
          );
          logTransactions.push(
            prisma.docinTracking.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                viewed: false,
                docinlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
                docinlog_file: req.file?.filename ?? null,
                docinlog_type: req.file?.mimetype ?? null,
                docinlog_size: req.file?.size ?? null,
              },
            })
          );
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docinTracking.delete({ where: { id: existingTracking.id } })
          );
        }
      } else if (receiverCode && departmentId) {
        const user = await prisma.user.findUnique({
          where: { username: receiverCode },
          include: { employee: true },
        });
        if (!user) return res.status(404).json({ message: "User not found" });

        const datelineValue = dateline
          ? new Date(dateline)
          : existingTracking?.dateline
          ? new Date(existingTracking.dateline)
          : null;

        const fileData = req.file
          ? {
              docinlog_original: Buffer.from(
                req.file.originalname,
                "latin1"
              ).toString("utf8"),
              docinlog_file: req.file.filename,
              docinlog_type: req.file.mimetype,
              docinlog_size: req.file.size,
            }
          : {};

        const createLogAndTrack = (
          receiverCode,
          rankId,
          roleId,
          posId,
          deptId,
          divId,
          docstatusId
        ) => {
          logTransactions.push(
            prisma.docinLog.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode,
                rankId,
                roleId,
                positionId: posId,
                docstatusId,
                dateline: datelineValue,
                description: description ?? null,
                departmentId: deptId,
                divisionId: divId,
                ...fileData,
              },
            })
          );
          logTransactions.push(
            prisma.docinTracking.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode,
                docstatusId,
                dateline: datelineValue,
                description: description ?? null,
                ...fileData,
              },
            })
          );
        };

        // บันทึกของผู้รับโดยตรง
        createLogAndTrack(
          user.username,
          user.rankId ?? null,
          user.roleId ?? null,
          user.employee?.posId ?? null,
          user.employee?.departmentId ?? null,
          user.employee?.divisionId ?? null,
          Number(docstatusId)
        );

        // บันทึกของแผนก
        const allDepartments = Array.isArray(departmentId)
          ? departmentId.map(Number)
          : [Number(departmentId)];

        if (!allDepartments.length)
          return res
            .status(400)
            .json({ message: "At least one departmentId is required." });

        for (const depId of allDepartments) {
          const department = await prisma.department.findUnique({
            where: { id: depId },
            include: {
              employees: {
                include: {
                  user: {
                    where: { roleId: 6 },
                    select: { rankId: true, roleId: true },
                  },
                },
              },
            },
          });

          const employees =
            department?.employees?.map((emp) => ({
              ...emp,
              user: emp.user[0] ?? null,
            })) || [];

          if (!employees.length)
            return res
              .status(404)
              .json({ message: `department ${depId} or employees not found` });

          const depUser = employees.find(
            (e) => e.user?.rankId === 1 && e.user?.roleId === 6
          );

          if (!depUser)
            return res.status(404).json({
              message: `No matching user found in department ${depId} with specified rank and role`,
            });

          createLogAndTrack(
            depUser.emp_code,
            depUser.user?.rankId ?? null,
            depUser.user?.roleId ?? null,
            depUser.posId ?? null,
            depUser.departmentId ?? null,
            depUser.divisionId ?? null,
            2
          );
        }

        // ลบ tracking เก่า (ถ้ามี)
        if (existingTracking) {
          logTransactions.push(
            prisma.docinTracking.delete({ where: { id: existingTracking.id } })
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
