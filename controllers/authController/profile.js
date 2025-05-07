const prisma = require("../../prisma/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {
  try {
    // Ensure the JWT middleware has populated req.user with the user's ID
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Fetch the user data from the database using Prisma
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id, // Use the user ID from the decoded token
      },
      include: {
        rank: true,
        role: true,
        employee: {
          include: {
            position: true,
            department: true,
            division: true,
            office: true,
            unit: true,
          },
        },
      },
    });

    // If the user does not exist, return a 404 error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Exclude sensitive fields (username, password)
    const { username, password, createdAt, updatedAt, ...filteredUser } = user;

    // Respond with the filtered user data
    res.json(filteredUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
