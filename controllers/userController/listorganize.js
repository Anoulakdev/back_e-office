const fs = require("fs");
const prisma = require("../../prisma/prisma");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const moment = require("moment-timezone");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/user"); // The directory where user images will be stored
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Appending file extension
  },
});

const upload = multer({ storage: storage }).single("userimg");

module.exports = async (req, res) => {
  try {
    const {
      extype,
      docstatusId,
      roleId,
      rankId,
      departmentId,
      divisionId,
      officeId,
      unitId,
    } = req.query;

    // สร้าง filter สำหรับการกรองข้อมูลตาม query params
    const filter = {
      where: {},
      orderBy: [{ roleId: "asc" }, { rankId: "asc" }],
      include: {
        rank: true,
        role: true,
        position: true,
        department: true,
        division: true,
        office: true,
        unit: true,
      },
    };

    switch (Number(docstatusId)) {
      case 1:
        switch (Number(roleId)) {
          case 2:
            filter.where.roleId = 4;
            break;
          default:
            break;
        }
        break;
      case 10:
        switch (Number(roleId)) {
          case 6:
            filter.where.roleId = 4;
            break;
          default:
            break;
        }
        break;
      case 2:
        switch (Number(roleId)) {
          case 4:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  rankId: { gt: Number(rankId) },
                },
                {
                  roleId: 11,
                },
              ],
            };
            break;
          case 11:
            filter.where.roleId = 11;
            break;
          case 6:
            if (roleId) {
              filter.where.roleId = Number(roleId);
            }
            if (Number(extype) === 1) {
              filter.where.rankId = { gt: Number(rankId) };
            } else {
              filter.where.rankId = { lt: Number(rankId) };
            }
            if (departmentId) {
              filter.where.departmentId = Number(departmentId);
            }
            break;
          case 7:
            if (Number(rankId) === 1 && Number(extype) === 2) {
              filter.where.roleId = 6;
              filter.where.departmentId = Number(departmentId);
            } else {
              if (Number(extype) === 1) {
                filter.where.roleId = Number(roleId);
                filter.where.rankId = { gt: Number(rankId) };
                filter.where.divisionId = Number(divisionId);
              } else {
                filter.where.roleId = Number(roleId);
                filter.where.rankId = { lt: Number(rankId) };
                filter.where.divisionId = Number(divisionId);
              }
            }
            break;
          case 8:
            if (roleId) {
              filter.where.roleId = Number(roleId);
            }
            if (rankId) {
              filter.where.rankId = { gt: Number(rankId) };
            }
            if (officeId) {
              filter.where.officeId = Number(officeId);
            }
            break;
          case 9:
            if (!rankId) {
              // ถ้าไม่มี rankId ให้ใช้แค่ roleId และ unitId
              filter.where = {
                roleId: Number(roleId),
                unitId: Number(unitId),
              };
            } else {
              // ถ้ามี rankId ให้ใช้ OR เงื่อนไขทั้ง roleId = 9 และ roleId = 10
              filter.where = {
                OR: [
                  {
                    roleId: 9,
                    rankId: { gt: Number(rankId) },
                    unitId: Number(unitId),
                  },
                  {
                    roleId: 10,
                    unitId: Number(unitId),
                  },
                ],
              };
            }
            break;
          default:
            break;
        }
        break;
      case 5:
      case 7:
        switch (Number(roleId)) {
          case 4:
            filter.where.roleId = Number(roleId);
            if (rankId) {
              filter.where.rankId = { lt: Number(rankId) };
            }
            break;
          case 6:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  rankId: { lt: Number(rankId) },
                  departmentId: Number(departmentId),
                },
                {
                  roleId: 4,
                },
              ],
            };

            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
          case 7:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  rankId: { lt: Number(rankId) },
                  divisionId: Number(divisionId),
                },
                {
                  roleId: { lt: Number(roleId) },
                  departmentId: Number(departmentId),
                },
              ],
            };

            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
          case 8:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  rankId: { lt: Number(rankId) },
                  officeId: Number(officeId),
                },
                {
                  roleId: 7,
                  divisionId: Number(divisionId),
                },
              ],
            };

            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
          case 9:
            const conditions = [
              {
                roleId: Number(roleId),
                rankId: { lt: Number(rankId) },
                unitId: Number(unitId),
              },
            ];

            // ตรวจสอบเงื่อนไขแล้วเพิ่มเข้าไปใน OR
            if (divisionId) {
              conditions.push({
                roleId: 7,
                divisionId: Number(divisionId),
              });
            } else if (officeId) {
              conditions.push({
                roleId: 8,
                officeId: Number(officeId),
              });
            }

            filter.where = {
              OR: conditions,
            };

            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];

            break;
          case 10:
            if (roleId) {
              filter.where.roleId = { lt: Number(roleId) };
            }
            if (unitId) {
              filter.where.unitId = Number(unitId);
            }
            break;
          default:
            break;
        }
        break;
      case 6:
        switch (Number(roleId)) {
          case 4:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  rankId: { gt: Number(rankId) },
                },
                {
                  roleId: 6,
                },
              ],
            };
            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
          case 6:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  rankId: { gt: Number(rankId) },
                  departmentId: Number(departmentId),
                },
                {
                  roleId: 7,
                  departmentId: Number(departmentId),
                },
              ],
            };
            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
          case 7:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  rankId: { gt: Number(rankId) },
                  divisionId: Number(divisionId),
                },
                {
                  roleId: { in: [8, 9] },
                  divisionId: Number(divisionId),
                },
              ],
            };
            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
          case 8:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  rankId: { gt: Number(rankId) },
                  officeId: Number(officeId),
                },
                {
                  roleId: 9,
                  officeId: Number(officeId),
                },
              ],
            };
            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
          case 9:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  rankId: { gt: Number(rankId) },
                  unitId: Number(unitId),
                },
                {
                  roleId: 10,
                  unitId: Number(unitId),
                },
              ],
            };
            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }

    // ดึงข้อมูลจาก Prisma
    const users = await prisma.user.findMany(filter);

    // การฟอร์แมตวันที่
    const formattedUsers = users.map((user) => ({
      ...user,
      createdAt: moment(user.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(user.updatedAt).tz("Asia/Vientiane").format(),
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};