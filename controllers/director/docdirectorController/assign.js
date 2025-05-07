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

const upload = multer({ storage: storage }).single("docdt_file");

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
        docexId,
        receiverCode,
        departmentId1 = [],
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

        if (!docex) {
          return res
            .status(404)
            .json({ message: "Document not found with the provided docexId" });
        }

        logTransactions.push(
          prisma.docexLog.create({
            data: {
              docexId: Number(docexId),
              assignerCode: req.user.username,
              receiverCode: user.employee.emp_code,
              rankId: Number(user.rankId) ?? null,
              roleId: Number(user.roleId) ?? null,
              positionId: Number(user.employee.posId) ?? null,
              docstatusId: Number(docstatusId),
              extype: Number(docex.extype) ?? null,
              description,
              departmentId: user.employee.departmentId ?? null,
              departmentactive: null,
            },
          }),
          prisma.docexTracking.create({
            data: {
              docexId: Number(docexId),
              assignerCode: req.user.username,
              receiverCode: user.employee.emp_code,
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

          if (!department || !department.employees.length) {
            return res.status(404).json({
              message: `Department ${departmentId} or employees not found`,
            });
          }

          const depUser = department.employees.find(
            (u) => u.user?.rankId === 1 && u.user?.roleId === 6
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
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                rankId: Number(depUser.user.rankId) ?? null,
                roleId: Number(depUser.user.roleId) ?? null,
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
                assignerCode: req.user.username,
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
