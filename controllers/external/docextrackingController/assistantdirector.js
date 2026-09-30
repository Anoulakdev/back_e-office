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
        dateline,
        docexlog_url,
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
              docexlog_url: docexlog_url ?? null,
            },
          }),
        );
        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.delete({ where: { id: existingTracking.id } }),
          );
        }
      } else if (
        receiverCode &&
        !departmentId1.length &&
        !departmentId2.length
      ) {
        const receiverCodes = Array.isArray(receiverCode)
          ? receiverCode
          : [receiverCode];

        const users = await prisma.user.findMany({
          where: { username: { in: receiverCodes } },
          include: { employee: true },
        });
        const userMap = new Map(users.map((u) => [u.username, u]));

        for (const receiverC of receiverCodes) {
          const user = userMap.get(receiverC);

          if (!user) {
            return res.status(404).json({
              message: `ບໍ່ພົບເຫັນພະນັກງານ: ${receiverC}`,
            });
          }

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
                "latin1",
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
                docexlog_url: docexlog_url ?? null,
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
                docexlog_url: docexlog_url ?? null,
              },
            }),
          );
        }

        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.delete({
              where: { id: existingTracking.id },
            }),
          );
        }
      } else if (
        (departmentId1.length || departmentId2.length) &&
        !receiverCode
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
            .json({ message: "ຕ້ອງມີຢ່າງນ້ອຍໜຶ່ງ departmentId" });
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
              message: `ບໍ່ພົບເຫັນພະນັກງານໃນຝ່າຍ ${departmentId}`,
            });
          }

          let depUser = null;
          const rankPriority = [1, 2, 3, 4, 5, 6, 7]; // ปรับลำดับความสำคัญตามต้องการ

          for (const rankId of rankPriority) {
            depUser = departmentWithUser.employees.find(
              (u) => u.user?.rankId === rankId && u.user?.roleId === 6,
            );
            if (depUser) break;
          }

          if (!depUser) {
            return res.status(404).json({
              message: `ບໍ່ພົບເຫັນພະນັກງານທີ່ກົງກັນໃນຝ່າຍ ${departmentId} ທີ່ມີລະດັບແລະບົດບາດที่ລະບຸ`,
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
                rankId: Number(depUser.user?.rankId) ?? null,
                roleId: Number(depUser.user?.roleId) ?? null,
                positionId: Number(depUser.posId) ?? null,
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
                    "utf8",
                  )
                  : null,
                docexlog_file: req.file ? req.file.filename : null,
                docexlog_type: req.file ? req.file.mimetype : null,
                docexlog_size: req.file ? req.file.size : null,
                docexlog_url: docexlog_url ?? null,
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
                    "utf8",
                  )
                  : null,
                docexlog_file: req.file ? req.file.filename : null,
                docexlog_type: req.file ? req.file.mimetype : null,
                docexlog_size: req.file ? req.file.size : null,
                docexlog_url: docexlog_url ?? null,
              },
            }),
          );
        }

        // 🔹 ลบ existingTracking **หลังจากเพิ่มข้อมูลเสร็จ**
        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.delete({
              where: { id: existingTracking.id },
            }),
          );
        }
      } else if (
        receiverCode &&
        (departmentId1.length || departmentId2.length)
      ) {
        const receiverCodes = Array.isArray(receiverCode)
          ? receiverCode
          : [receiverCode];

        const fetchedUsers = await prisma.user.findMany({
          where: { username: { in: receiverCodes } },
          include: { employee: true },
        });
        const userMap = new Map(fetchedUsers.map((u) => [u.username, u]));
        const users = [];

        for (const receiverC of receiverCodes) {
          const user = userMap.get(receiverC);

          if (!user) {
            return res.status(404).json({
              message: `ບໍ່ພົບເຫັນພະນັກງານ: ${receiverC}`,
            });
          }

          users.push(user);
        }

        const datelineValue = dateline
          ? new Date(dateline)
          : existingTracking?.dateline
            ? new Date(existingTracking.dateline)
            : null;

        const fileData = req.file
          ? {
            docexlog_original: Buffer.from(
              req.file.originalname,
              "latin1",
            ).toString("utf8"),
            docexlog_file: req.file.filename,
            docexlog_type: req.file.mimetype,
            docexlog_size: req.file.size,
          }
          : {};

        const createLogAndTrack = (
          receiverCode,
          rankId,
          roleId,
          posId,
          deptId,
          divId,
          docstatusId,
          departmentactive = null,
        ) => {
          logTransactions.push(
            prisma.docexLog.create({
              data: {
                docexId: Number(docexId),
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
                extype: Number(docex.extype) ?? null,
                ...fileData,
                docexlog_url: docexlog_url ?? null,
                departmentactive,
              },
            }),
          );
          logTransactions.push(
            prisma.docexTracking.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.username,
                receiverCode,
                docstatusId,
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                ...fileData,
                docexlog_url: docexlog_url ?? null,
                departmentactive,
              },
            }),
          );
        };

        // บันทึกของผู้รับโดยตรง
        for (const user of users) {
          createLogAndTrack(
            user.username,
            user.rankId ?? null,
            user.roleId ?? null,
            user.employee?.posId ?? null,
            user.employee?.departmentId ?? null,
            user.employee?.divisionId ?? null,
            Number(docstatusId),
            existingTracking?.departmentactive,
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

        if (!allDepartments.length)
          return res
            .status(400)
            .json({ message: "ຕ້ອງມີຢ່າງນ້ອຍໜຶ່ງ departmentId" });

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
              message: `ບໍ່ພົບເຫັນພະນັກງານໃນຝ່າຍ ${departmentId}`,
            });
          }

          let depUser = null;
          const rankPriority = [1, 2, 3, 4, 5, 6, 7]; // ปรับลำดับความสำคัญตามต้องการ

          for (const rankId of rankPriority) {
            depUser = departmentWithUser.employees.find(
              (u) => u.user?.rankId === rankId && u.user?.roleId === 6,
            );
            if (depUser) break;
          }

          if (!depUser)
            return res.status(404).json({
              message: `ບໍ່ພົບເຫັນພະນັກງານທີ່ກົງກັນໃນຝ່າຍ ${departmentId} ທີ່ມີລະດັບແລະບົດບາດที่ລະບຸ`,
            });

          // ຖ້າ depUser.emp_code ກົງກັບ receiverCode ໃຫ້ບັນທຶກສະເພາະໃນ receiverCode (ບໍ່ຕ້ອງບັນທຶກໃນ department)
          const isReceiverAlreadyAdded =
            users.some(
              (u) =>
                String(u.username).trim() === String(depUser.emp_code).trim() ||
                (u.employee?.emp_code &&
                  String(u.employee.emp_code).trim() ===
                  String(depUser.emp_code).trim()),
            ) ||
            receiverCodes.some(
              (c) => String(c).trim() === String(depUser.emp_code).trim(),
            );

          if (isReceiverAlreadyAdded) {
            continue;
          }

          createLogAndTrack(
            depUser.emp_code,
            depUser.user?.rankId ?? null,
            depUser.user?.roleId ?? null,
            depUser.posId ?? null,
            depUser.departmentId ?? null,
            depUser.divisionId ?? null,
            Number(docstatusId),
            departmentactive,
          );
        }

        // ลบ tracking เก่า (ถ้ามี)
        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.delete({ where: { id: existingTracking.id } }),
          );
        }
      } else {
        return res.status(400).json({
          message: "ຂໍ້ມູນມີການຜິດພາດ",
          error: "Invalid payload: no matching assignment condition found",
        });
      }

      const results = await prisma.$transaction(logTransactions);

      res.status(201).json({
        message: "ມອບໝາຍເອກະສານສຳເລັດ",
        data: results,
      });
    } catch (error) {
      console.error("Error assigning document:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
};
