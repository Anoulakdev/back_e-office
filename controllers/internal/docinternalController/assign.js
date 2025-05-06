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
        divisionId = [],
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

      if (receiverCode) {
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
              receiverCode: user.employee.emp_code,
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
              receiverCode: user.employee.emp_code,
              docstatusId: Number(docstatusId),
              description,
            },
          })
        );
      } else {
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
                    select: {
                      rankId: true,
                      roleId: true,
                    },
                  },
                },
              },
            },
          });

          if (!division || !division.employees.length) {
            return res.status(404).json({
              message: `Division ${divisionId} or employees not found.`,
            });
          }

          const depUser = division.employees.find(
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
