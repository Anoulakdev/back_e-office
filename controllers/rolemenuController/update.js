const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { rolemenuId } = req.params;
    const { roleId, title, path } = req.body;

    const updated = await prisma.roleMenu.update({
      where: {
        id: Number(rolemenuId),
      },
      data: {
        roleId,
        title,
        path,
      },
    });

    res.json({ message: "Updated Success!! ", data: updated });
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
