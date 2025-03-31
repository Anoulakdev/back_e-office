const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { role_name, role_code, role_description, authrole } = req.body;

    const updated = await prisma.role.update({
      where: {
        id: Number(roleId),
      },
      data: {
        role_name: role_name,
        role_code: role_code,
        role_description: role_description,
        authrole: authrole,
      },
    });

    res.json({ message: "Updated Success!! ", data: updated });
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
