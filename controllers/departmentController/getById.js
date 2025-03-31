const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const department = await prisma.department.findUnique({
      where: {
        id: Number(departmentId),
      },
      include: {
        divisions: {
          include: {
            units: true,
            offices: {
              include: {
                units: true,
              },
            },
          },
        },
      },
    });

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json(department);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
