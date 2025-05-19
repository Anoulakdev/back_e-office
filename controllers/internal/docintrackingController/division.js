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
        docinId,
        receiverCode,
        divisionId,
        officeId,
        unitId,
        docstatusId,
        description,
        dateline,
      } = req.body;

      if (!docinId) {
        return res.status(400).json({ message: "docinId is required" });
      }

      let logTransactions = [];

      const existingTracking = await prisma.docinTracking.findFirst({
        where: { docinId: Number(docinId), receiverCode: req.user.username },
      });

      const docin = await prisma.docInternal.findUnique({
        where: {
          id: Number(docinId),
        },
      });

      if (!receiverCode && !divisionId && !unitId && !officeId) {
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
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docinTracking.delete({ where: { id: existingTracking.id } })
          );
        }
      } else if (receiverCode && !divisionId && !officeId && !unitId) {
        // 🔹 ถ้ามี receiverCode ใช้ข้อมูลนี้เท่านั้น
        const user = await prisma.user.findUnique({
          where: { username: receiverCode },
          include: {
            employee: true,
          },
        });

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

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
      } else if (unitId && !receiverCode && !divisionId && !officeId) {
        const unit = await prisma.unit.findUnique({
          where: { id: Number(unitId) },
          include: {
            employees: {
              include: {
                user: {
                  where: {
                    roleId: 9,
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

        const unitWithUser = {
          ...unit,
          employees: unit?.employees?.length
            ? unit.employees.map((employee) => ({
                ...employee,
                user: employee.user[0] || null,
              }))
            : [],
        };

        if (!unitWithUser || !unitWithUser.employees.length) {
          return res.status(404).json({
            message: `unit ${unitId} or employees not found`,
          });
        }

        const depUser = unitWithUser.employees.find(
          (u) => u.user?.rankId === 1 && u.user?.roleId === 9
        );

        if (!depUser) {
          return res.status(404).json({
            message: `No matching user found in unit ${unitId} with specified rank and role`,
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
              officeId: depUser.officeId ? Number(depUser.officeId) : null,
              unitId: depUser.unitId ? Number(depUser.unitId) : null,
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
      } else if (officeId && !receiverCode && !divisionId && !unitId) {
        const office = await prisma.office.findUnique({
          where: { id: Number(officeId) },
          include: {
            employees: {
              include: {
                user: {
                  where: {
                    roleId: 8,
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

        const officeWithUser = {
          ...office,
          employees: office?.employees?.length
            ? office.employees.map((employee) => ({
                ...employee,
                user: employee.user[0] || null,
              }))
            : [],
        };

        if (!officeWithUser || !officeWithUser.employees.length) {
          return res.status(404).json({
            message: `office ${officeId} or employees not found`,
          });
        }

        const depUser = officeWithUser.employees.find(
          (u) => u.user?.rankId === 1 && u.user?.roleId === 8
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
              officeId: depUser.officeId ? Number(depUser.officeId) : null,
              unitId: depUser.unitId ? Number(depUser.unitId) : null,
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
      } else if (divisionId && !receiverCode && !officeId && !unitId) {
        const allDivisions = Array.isArray(divisionId)
          ? divisionId.map((id) => Number(id))
          : [Number(divisionId)];

        if (!allDivisions.length) {
          return res
            .status(400)
            .json({ message: "At least one divisionId is required." });
        }

        for (const divisionId of allDivisions) {
          const division = await prisma.division.findUnique({
            where: { id: divisionId },
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
      } else if (receiverCode && divisionId) {
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
          divId
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
                docstatusId: Number(docstatusId),
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
                docstatusId: Number(docstatusId),
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
          user.employee?.divisionId ?? null
        );

        // บันทึกของแผนก
        const allDivisions = Array.isArray(divisionId)
          ? divisionId.map((id) => Number(id))
          : [Number(divisionId)];

        if (!allDivisions.length) {
          return res
            .status(400)
            .json({ message: "At least one divisionId is required." });
        }

        for (const divisionId of allDivisions) {
          const division = await prisma.division.findUnique({
            where: { id: divisionId },
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

          createLogAndTrack(
            depUser.emp_code,
            depUser.user?.rankId ?? null,
            depUser.user?.roleId ?? null,
            depUser.posId ?? null,
            depUser.departmentId ?? null,
            depUser.divisionId ?? null
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
