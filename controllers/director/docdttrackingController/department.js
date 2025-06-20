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
    if (err) {
      const errorMsg =
        err instanceof multer.MulterError ? "Multer error" : "Unknown error";
      return res.status(500).json({ message: errorMsg, error: err.message });
    }

    try {
      const {
        docdtId,
        receiverCode,
        divisionId1 = [],
        divisionId2 = [],
        docstatusId,
        description,
        dateline,
      } = req.body;
      if (!docdtId)
        return res.status(400).json({ message: "docdtId is required" });

      let logTransactions = [];
      const existingTracking = await prisma.docdtTracking.findFirst({
        where: { docdtId: Number(docdtId), receiverCode: req.user.username },
      });

      const docdt = await prisma.docDirector.findUnique({
        where: {
          id: Number(docdtId),
        },
      });

      if (!receiverCode && !divisionId1.length && !divisionId2.length) {
        if (Number(docstatusId) === 4) {
          logTransactions.push(
            prisma.docdtLog.deleteMany({
              where: {
                AND: [
                  { docdtId: Number(docdtId) },
                  { departmentId: req.user.employee.departmentId },
                ],
              },
            })
          );
        }

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
      } else if (receiverCode) {
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
            docdtlog_original: existingTracking.docdtlog_original ?? null,
            docdtlog_file: existingTracking?.docdtlog_file ?? null,
            docdtlog_type: existingTracking?.docdtlog_type ?? null,
            docdtlog_size: existingTracking?.docdtlog_size ?? null,
          };
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
              dateline: datelineValue,
              description: description ?? null,
              departmentId: user.employee.departmentId
                ? Number(user.employee.departmentId)
                : null,
              divisionId: user.employee.divisionId
                ? Number(user.employee.divisionId)
                : null,
              departmentactive: existingTracking?.departmentactive ?? null,
              ...docdtlogfileData,
            },
          })
        );
        if (existingTracking) {
          logTransactions.push(
            prisma.docdtTracking.update({
              where: { id: existingTracking.id },
              data: {
                assignerCode: req.user.username,
                receiverCode: user.username,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                viewed: false,
                ...docdtlogfileData,
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

          let depUser = null;
          const rankPriority = [1, 2, 3, 4, 5, 6, 7]; // ปรับลำดับความสำคัญตามต้องการ

          for (const rankId of rankPriority) {
            depUser = divisionWithUser.employees.find(
              (u) => u.user?.rankId === rankId && u.user?.roleId === 7
            );
            if (depUser) break;
          }

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
                departmentId: depUser.departmentId
                  ? Number(depUser.departmentId)
                  : null,
                departmentactive: existingTracking?.departmentactive ?? null,
                divisionId,
                divisionactive,
                docdtlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
                docdtlog_file: req.file?.filename ?? null,
                docdtlog_type: req.file?.mimetype ?? null,
                docdtlog_size: req.file?.size ?? null,
              },
            })
          );
          logTransactions.push(
            prisma.docdtTracking.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                departmentactive: existingTracking?.departmentactive ?? null,
                divisionactive,
                docdtlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
                docdtlog_file: req.file?.filename ?? null,
                docdtlog_type: req.file?.mimetype ?? null,
                docdtlog_size: req.file?.size ?? null,
              },
            })
          );
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docdtTracking.delete({ where: { id: existingTracking.id } })
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
