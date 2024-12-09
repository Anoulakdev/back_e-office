const prisma = require("../prisma/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Step 1: Validate input
    if (!username) {
      return res.status(400).json({ message: "Username is required!!" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required!!" });
    }

    // Step 2: Check if the user exists
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials!!" });
    }

    // Step 3: Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password is not match!!" });
    }

    // Step 4: Fetch user with all relations
    const userWithAll = await prisma.user.findUnique({
      where: { user_id: user.user_id },
      include: {
        role: true,
        position: true,
        department: true,
        division: true,
        office: true,
        unit: true,
      },
    });

    // Step 5: Construct payload
    const payload = {
      user_id: userWithAll.user_id,
      first_name: userWithAll.first_name,
      last_name: userWithAll.last_name,
      emp_code: userWithAll.emp_code,
      status: userWithAll.status,
      gender: userWithAll.gender,
      user_image: userWithAll.user_image,
      role_id: userWithAll.role_id,
      pos_id: userWithAll.pos_id,
      department_id: userWithAll.department_id,
      division_id: userWithAll.division_id,
      office_id: userWithAll.office_id,
      unit_id: userWithAll.unit_id,
      tel: userWithAll.tel,
      telapp: userWithAll.telapp,
      email: userWithAll.email,
      // Include related data
      role: userWithAll.role,
      position: userWithAll.position,
      department: userWithAll.department,
      division: userWithAll.division,
      office: userWithAll.office,
      unit: userWithAll.unit,
    };

    // Step 6: Create access token
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Step 7: Respond with user data and token
    res.json({
      user: payload,
      token: accessToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.profile = async (req, res) => {
  try {
    // Ensure the JWT middleware has populated req.user with the user's ID
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Fetch the user data from the database using Prisma
    const user = await prisma.user.findUnique({
      where: {
        user_id: Number(req.user.user_id), // Use the user ID from the decoded token
      },
      include: {
        role: true,
        position: true,
        department: true,
        division: true,
        office: true,
        unit: true,
      },
    });

    // If the user does not exist, return a 404 error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { username, password, ...filteredUser } = user;

    // Respond with the user data
    res.json(filteredUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
