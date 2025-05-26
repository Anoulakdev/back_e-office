const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { docexportId } = req.params;
    const { export_text, export_title, export_description } = req.body;

    const updated = await prisma.docExport.update({
      where: {
        id: Number(docexportId),
      },
      data: {
        export_text: export_text,
        export_title: export_title,
        export_description: export_description,
        export_status: true,
        exporterCode: req.user.username,
      },
    });

    res.json({ message: "Updated Success!! ", data: updated });
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
