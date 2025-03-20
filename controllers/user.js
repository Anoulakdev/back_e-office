const fs = require("fs");
const prisma = require("../prisma/prisma");
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

exports.create = (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // Handle multer-specific errors
      return res.status(500).json({
        message: "Multer error occurred when uploading.",
        error: err.message,
      });
    } else if (err) {
      // Handle other types of errors
      return res.status(500).json({
        message: "Unknown error occurred when uploading.",
        error: err.message,
      });
    }

    try {
      const {
        username,
        emp_code,
        first_name,
        last_name,
        gender,
        tel,
        email,
        rankId,
        roleId,
        posId,
        departmentId,
        divisionId,
        officeId,
        unitId,
      } = req.body;

      // Step 1: Validate input fields
      if (!emp_code || !first_name || !last_name) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Step 2: Check if the username already exists
      const checkUser = await prisma.user.findFirst({
        where: {
          OR: [{ username: username }, { emp_code: emp_code }],
        },
      });
      if (checkUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Step 3: Hash default password (you might want to allow password as input)
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash("EDL1234", salt); // Default password can be changed as needed

      // Step 4: Create new user
      const newUser = await prisma.user.create({
        data: {
          username: username || emp_code,
          password: hashPassword,
          emp_code,
          first_name,
          last_name,
          gender,
          tel,
          email,
          rankId: Number(rankId),
          roleId: Number(roleId),
          posId: Number(posId),
          departmentId: Number(departmentId),
          divisionId: Number(divisionId),
          officeId: Number(officeId),
          unitId: Number(unitId),
          userimg: req.file ? `${req.file.filename}` : null, // Path to the uploaded image
        },
      });

      res.status(201).json({
        message: "User created successfully!",
        data: newUser,
      });
    } catch (err) {
      console.error("Server error:", err);
      res.status(500).send("Server Error");
    }
  });
};

exports.list = async (req, res) => {
  try {
    const { search, departmentId, divisionId, officeId, unitId } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { emp_code: { contains: search, mode: "insensitive" } },
      ];
    }

    if (departmentId) where.departmentId = Number(departmentId);
    if (divisionId) where.divisionId = Number(divisionId);
    if (officeId) where.officeId = Number(officeId);
    if (unitId) where.unitId = Number(unitId);

    const filter = {
      where,
      orderBy: {
        rankId: "asc",
      },
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

    const users = await prisma.user.findMany(filter);

    const formattedUsers = users.map((user) => ({
      ...user,
      createdAt: moment(user.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(user.updatedAt).tz("Asia/Vientiane").format(),
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.listorganize = async (req, res) => {
  try {
    const {
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
      orderBy: {
        rankId: "asc",
      },
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
      case 2:
        switch (Number(roleId)) {
          case 4:
            if (roleId) {
              filter.where.roleId = Number(roleId);
            }
            if (rankId) {
              filter.where.rankId = { gt: Number(rankId) };
            }
            break;
          case 6:
            if (roleId) {
              filter.where.roleId = Number(roleId);
            }
            if (rankId) {
              filter.where.rankId = { gt: Number(rankId) };
            }
            if (departmentId) {
              filter.where.departmentId = Number(departmentId);
            }
            break;
          case 7:
            if (roleId) {
              filter.where.roleId = Number(roleId);
            }
            if (rankId) {
              filter.where.rankId = { gt: Number(rankId) };
            }
            if (divisionId) {
              filter.where.divisionId = Number(divisionId);
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
      case 3:
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

exports.getById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
      include: {
        rank: true,
        role: true,
        position: true,
        department: true,
        division: true,
        office: true,
        unit: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format dates
    const formattedUser = {
      ...user,
      createdAt: moment(user.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(user.updatedAt).tz("Asia/Vientiane").format(),
    };

    res.json(formattedUser);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.update = async (req, res) => {
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
      const { userId } = req.params;
      const {
        first_name,
        last_name,
        gender,
        tel,
        email,
        rankId,
        roleId,
        posId,
        departmentId,
        divisionId,
        officeId,
        unitId,
      } = req.body;

      // Step 1: Find the user to update
      const user = await prisma.user.findUnique({
        where: {
          id: Number(userId),
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Step 2: If a new photo is uploaded and an old photo exists, delete the old photo
      let userimgPath = user.userimg; // Keep old photo path
      if (req.file) {
        // Only attempt to delete if there is an existing photo path
        if (user.userimg) {
          const oldUserimgPath = path.join(
            __dirname,
            "../uploads/user",
            path.basename(user.userimg)
          );
          fs.unlink(oldUserimgPath, (err) => {
            if (err) {
              console.error("Error deleting old image: ", err);
            }
          });
        }

        // Set the new photo path
        userimgPath = `${req.file.filename}`;
      }

      // Step 3: Update the user record
      const updated = await prisma.user.update({
        where: {
          id: Number(userId),
        },
        data: {
          first_name,
          last_name,
          gender,
          tel,
          email,
          rankId: Number(rankId),
          roleId: Number(roleId),
          posId: Number(posId),
          departmentId: Number(departmentId),
          divisionId: Number(divisionId),
          officeId: Number(officeId),
          unitId: Number(unitId),
          userimg: userimgPath,
        },
      });

      res.json({ message: "Update successful!", data: updated });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error" });
    }
  });
};

exports.remove = async (req, res) => {
  try {
    const { userId } = req.params;

    // Step 1: Find the user by ID
    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 2: Delete the photo file if it exists
    if (user.userimg) {
      const userimgPath = path.join(__dirname, "../uploads/user", user.userimg);
      fs.unlink(userimgPath, (err) => {
        if (err) {
          console.error("Error deleting userimg file: ", err);
          return res
            .status(500)
            .json({ message: "Error deleting userimg file" });
        }
      });
    }

    // Step 3: Delete the user from the database
    const removed = await prisma.user.delete({
      where: {
        id: Number(userId),
      },
    });

    res.status(200).json({ message: "User and userimg deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
