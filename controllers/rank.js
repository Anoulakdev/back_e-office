const prisma = require("../prisma/prisma");

exports.create = async (req, res) => {
  try {
    const { rank_name } = req.body;

    // Validate input fields
    if (!rank_name) {
      return res.status(400).json({ message: "Invalid input fields" });
    }

    // Create new user in the database
    const newrank = await prisma.rank.create({
      data: {
        rank_name,
      },
    });

    res.json({
      message: "rank created successfully!",
      data: newrank,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const rank = await prisma.rank.findMany();

    res.json(rank);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { rankId } = req.params;

    const rank = await prisma.rank.findUnique({
      where: {
        id: Number(rankId),
      },
    });

    if (!rank) {
      return res.status(404).json({ message: "rank not found" });
    }

    res.json(rank);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { rankId } = req.params;
    const { rank_name } = req.body;

    const updated = await prisma.rank.update({
      where: {
        id: Number(rankId),
      },
      data: {
        rank_name: rank_name,
      },
    });

    res.json({ message: "Updated Success!! ", data: updated });
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { rankId } = req.params;

    const removed = await prisma.rank.delete({
      where: {
        id: Number(rankId),
      },
    });

    res.status(200).json({ message: "rank deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
