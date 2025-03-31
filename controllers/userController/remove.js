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
      const userimgPath = path.join(__dirname, "../../uploads/user", user.userimg);
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