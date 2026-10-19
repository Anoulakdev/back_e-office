const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const closureStatus = await prisma.closureStatus.findMany({
      orderBy: {
        id: "asc",
      },
    });

    res.json(closureStatus);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
