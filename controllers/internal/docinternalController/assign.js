const fs = require("fs");
const prisma = require("../../../prisma/prisma");
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

const upload = multer({ storage: storage }).single("docin_file");

module.exports = async (req, res) => {
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
        docinId,
        receiverCode,
        departmentId,
        divisionId,
        officeId,
        docstatusId,
        description,
      } = req.body;

      if (!docinId) {
        return res.status(400).json({ message: "docinId is required" });
      }

      const docin = await prisma.docInternal.findUnique({
        where: {
          id: Number(docinId),
        },
      });

      if (!docin) {
        return res
          .status(404)
          .json({ message: "Document not found with the provided docinId" });
      }

      let logTransactions = [];

      if (receiverCode && !departmentId && !divisionId && !officeId) {
        // 🔹 ถ้ามี receiverCode ใช้ข้อมูลนี้เท่านั้น
        const user = await prisma.user.findUnique({
          where: { username: receiverCode },
          include: {
            employee: true,
          },
        });

        if (!user) {
          return res
            .status(404)
            .json({ message: "User not found with the provided receiverCode" });
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
              description,
              departmentId: user.employee.departmentId
                ? Number(user.employee.departmentId)
                : null,
              divisionId: user.employee.divisionId
                ? Number(user.employee.divisionId)
                : null,
            },
          }),
          prisma.docinTracking.create({
            data: {
              docinId: Number(docinId),
              assignerCode: req.user.username,
              receiverCode: user.username,
              docstatusId: Number(docstatusId),
              description,
            },
          })
        );
      } else if (departmentId && !receiverCode && !divisionId && !officeId) {
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

          logTransactions.push(
            prisma.docinLog.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                rankId: Number(depUser.user.rankId) ?? null,
                roleId: Number(depUser.user.roleId) ?? null,
                positionId: Number(depUser.posId) ?? null,
                docstatusId: Number(docstatusId) ?? null,
                description,
                departmentId: Number(depUser.departmentId) ?? null,
                divisionId: Number(depUser.divisionId) ?? null,
              },
            }),
            prisma.docinTracking.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                description,
              },
            })
          );
        }
      } else if (divisionId && !receiverCode && !departmentId && !officeId) {
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

          logTransactions.push(
            prisma.docinLog.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                rankId: Number(depUser.user.rankId) ?? null,
                roleId: Number(depUser.user.roleId) ?? null,
                positionId: Number(depUser.posId) ?? null,
                docstatusId: Number(docstatusId) ?? null,
                description,
                departmentId: Number(depUser.departmentId) ?? null,
                divisionId: Number(depUser.divisionId) ?? null,
              },
            }),
            prisma.docinTracking.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                description,
              },
            })
          );
        }
      } else if (officeId && !receiverCode && !departmentId && !divisionId) {
        const allOffices = Array.isArray(officeId)
          ? officeId.map((id) => Number(id))
          : [Number(officeId)];

        if (!allOffices.length) {
          return res
            .status(400)
            .json({ message: "At least one officeId is required." });
        }

        for (const officeId of allOffices) {
          const office = await prisma.office.findUnique({
            where: { id: officeId },
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

          logTransactions.push(
            prisma.docinLog.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                rankId: Number(depUser.user.rankId) ?? null,
                roleId: Number(depUser.user.roleId) ?? null,
                positionId: Number(depUser.posId) ?? null,
                docstatusId: Number(docstatusId) ?? null,
                description,
                departmentId: Number(depUser.departmentId) ?? null,
                divisionId: Number(depUser.divisionId) ?? null,
                officeId: Number(depUser.officeId) ?? null,
              },
            }),
            prisma.docinTracking.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                description,
              },
            })
          );
        }
      } else if (receiverCode && departmentId) {
        const user = await prisma.user.findUnique({
          where: { username: receiverCode },
          include: { employee: true },
        });

        if (!user) {
          return res
            .status(404)
            .json({ message: "User not found with the provided receiverCode" });
        }

        const createLogs = (
          receiverCode,
          rankId,
          roleId,
          positionId,
          departmentId,
          divisionId
        ) => [
          prisma.docinLog.create({
            data: {
              docinId: Number(docinId),
              assignerCode: req.user.username,
              receiverCode,
              rankId,
              roleId,
              positionId,
              docstatusId: Number(docstatusId),
              description,
              departmentId,
              divisionId,
            },
          }),
          prisma.docinTracking.create({
            data: {
              docinId: Number(docinId),
              assignerCode: req.user.username,
              receiverCode,
              docstatusId: Number(docstatusId),
              description,
            },
          }),
        ];

        logTransactions.push(
          ...createLogs(
            user.username,
            user.rankId ?? null,
            user.roleId ?? null,
            user.employee?.posId ?? null,
            user.employee?.departmentId ?? null,
            user.employee?.divisionId ?? null
          )
        );

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

          logTransactions.push(
            ...createLogs(
              depUser.emp_code,
              depUser.user?.rankId ?? null,
              depUser.user?.roleId ?? null,
              depUser.posId ?? null,
              depUser.departmentId ?? null,
              depUser.divisionId ?? null
            )
          );
        }
      } else if (receiverCode && divisionId) {
        const user = await prisma.user.findUnique({
          where: { username: receiverCode },
          include: { employee: true },
        });

        if (!user) {
          return res
            .status(404)
            .json({ message: "User not found with the provided receiverCode" });
        }

        const createLogs = (
          receiverCode,
          rankId,
          roleId,
          positionId,
          departmentId,
          divisionId
        ) => [
          prisma.docinLog.create({
            data: {
              docinId: Number(docinId),
              assignerCode: req.user.username,
              receiverCode,
              rankId,
              roleId,
              positionId,
              docstatusId: Number(docstatusId),
              description,
              departmentId,
              divisionId,
            },
          }),
          prisma.docinTracking.create({
            data: {
              docinId: Number(docinId),
              assignerCode: req.user.username,
              receiverCode,
              docstatusId: Number(docstatusId),
              description,
            },
          }),
        ];

        logTransactions.push(
          ...createLogs(
            user.username,
            user.rankId ?? null,
            user.roleId ?? null,
            user.employee?.posId ?? null,
            user.employee?.departmentId ?? null,
            user.employee?.divisionId ?? null
          )
        );

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

          logTransactions.push(
            ...createLogs(
              depUser.emp_code,
              depUser.user?.rankId ?? null,
              depUser.user?.roleId ?? null,
              depUser.posId ?? null,
              depUser.departmentId ?? null,
              depUser.divisionId ?? null
            )
          );
        }
      } else if (receiverCode && officeId) {
        const user = await prisma.user.findUnique({
          where: { username: receiverCode },
          include: { employee: true },
        });

        if (!user) {
          return res
            .status(404)
            .json({ message: "User not found with the provided receiverCode" });
        }

        const createLogs = (
          receiverCode,
          rankId,
          roleId,
          positionId,
          departmentId,
          divisionId,
          officeId
        ) => [
          prisma.docinLog.create({
            data: {
              docinId: Number(docinId),
              assignerCode: req.user.username,
              receiverCode,
              rankId,
              roleId,
              positionId,
              docstatusId: Number(docstatusId),
              description,
              departmentId,
              divisionId,
              officeId,
            },
          }),
          prisma.docinTracking.create({
            data: {
              docinId: Number(docinId),
              assignerCode: req.user.username,
              receiverCode,
              docstatusId: Number(docstatusId),
              description,
            },
          }),
        ];

        logTransactions.push(
          ...createLogs(
            user.username,
            user.rankId ?? null,
            user.roleId ?? null,
            user.employee?.posId ?? null,
            user.employee?.departmentId ?? null,
            user.employee?.divisionId ?? null,
            user.employee?.officeId ?? null
          )
        );

        const allOffices = Array.isArray(officeId)
          ? officeId.map((id) => Number(id))
          : [Number(officeId)];

        if (!allOffices.length) {
          return res
            .status(400)
            .json({ message: "At least one officeId is required." });
        }

        for (const officeId of allOffices) {
          const office = await prisma.office.findUnique({
            where: { id: officeId },
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

          logTransactions.push(
            ...createLogs(
              depUser.emp_code,
              depUser.user?.rankId ?? null,
              depUser.user?.roleId ?? null,
              depUser.posId ?? null,
              depUser.departmentId ?? null,
              depUser.divisionId ?? null,
              depUser.officeId ?? null
            )
          );
        }
      }

      // อัปเดตสถานะของ docinternal
      const updateDocInternal = prisma.docInternal.update({
        where: {
          id: Number(docinId),
        },
        data: {
          assignto: 1,
        },
      });

      const transactions = [updateDocInternal, ...logTransactions];

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
