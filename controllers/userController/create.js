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

module.exports = (req, res) => {
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
      const { username, name, rankId, roleId, departmentId, divisionId } =
        req.body;

      // Step 1: Validate input fields
      if (!username) {
        return res.status(400).json({ message: "Missing required username" });
      }

      if (!roleId) {
        return res.status(400).json({ message: "Missing required roleId" });
      }

      // Step 2: Check if the username already exists
      const checkUser = await prisma.user.findUnique({
        where: {
          username: username,
        },
      });
      if (checkUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const checkEmp = await prisma.employee.findUnique({
        where: {
          emp_code: username,
        },
      });

      // Step 3: Hash default password (you might want to allow password as input)
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash("EDL1234", salt);

      const maxId = await prisma.user.aggregate({
        _max: { id: true },
      });

      const nextId = (maxId._max.id || 0) + 1;

      // Step 4: Create new user
      const newUser = await prisma.user.create({
        data: {
          id: nextId,
          username: username,
          password: hashPassword,
          name,
          employeeId: checkEmp ? Number(checkEmp.id) : null,
          rankId: rankId ? Number(rankId) : null,
          roleId: Number(roleId),
          departmentId: departmentId ? Number(departmentId) : null,
          divisionId: divisionId ? Number(divisionId) : null,
          userimg: req.file ? `${req.file.filename}` : null,
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
