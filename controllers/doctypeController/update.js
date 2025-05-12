const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { doctypeId } = req.params;
    const { doctype_name, soptype, actionMax, followMax } = req.body;

    const updated = await prisma.docType.update({
      where: {
        id: Number(doctypeId),
      },
      data: {
        doctype_name: doctype_name,
        soptype: soptype,
        actionMax: actionMax,
        followMax: followMax,
      },
    });

    res.json({ message: "Updated Success!! ", data: updated });
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
