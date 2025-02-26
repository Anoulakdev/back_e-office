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
      // Destructure body values
      const {
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
      const checkUser = await prisma.user.findUnique({
        where: { username: emp_code },
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
          username: emp_code,
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
      case 2:
        switch (Number(roleId)) {
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
            if (roleId) {
              filter.where.roleId = Number(roleId);
            }
            if (rankId) {
              filter.where.rankId = { gt: Number(rankId) };
            }
            if (unitId) {
              filter.where.unitId = Number(unitId);
            }
            break;
          case 10:
            if (roleId) {
              filter.where.roleId = Number(roleId);
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
        switch (Number(roleId)) {
          case 6:
            if (roleId) {
              filter.where.roleId = Number(roleId);
            }
            if (rankId) {
              filter.where.rankId = { lt: Number(rankId) };
            }
            if (departmentId) {
              filter.where.departmentId = Number(departmentId);
            }
            break;
          case 7:
            if (roleId) {
              filter.where.roleId = { lt: Number(roleId) };
            }
            if (departmentId) {
              filter.where.departmentId = Number(departmentId);
            }
            break;
          case 8:
            if (roleId) {
              filter.where.roleId = { lt: Number(roleId) };
            }
            if (divisionId) {
              filter.where.divisionId = Number(divisionId);
            }
            break;
          case 9:
            if (roleId) {
              filter.where.roleId = { lt: Number(roleId) };
            }
            if (divisionId) {
              filter.where.divisionId = Number(divisionId);
            }
            if (officeId) {
              filter.where.officeId = Number(officeId);
            }
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
      case 4:
        switch (Number(roleId)) {
          case 6:
            if (roleId) {
              filter.where.roleId = Number(roleId) + 1;
            }
            if (divisionId) {
              filter.where.divisionId = Number(divisionId);
            }
            break;
          case 7:
            if (officeId) {
              filter.where.roleId = Number(roleId) + 1;
              filter.where.officeId = Number(officeId);
            }
            if (unitId) {
              filter.where.roleId = Number(roleId) + 2;
              filter.where.unitId = Number(unitId);
            }
            break;
          case 8:
            if (roleId) {
              filter.where.roleId = Number(roleId) + 1;
            }
            if (unitId) {
              filter.where.unitId = Number(unitId);
            }
            break;
          case 9:
            if (roleId) {
              filter.where.roleId = Number(roleId) + 1;
            }
            if (unitId) {
              filter.where.unitId = Number(unitId);
            }
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
