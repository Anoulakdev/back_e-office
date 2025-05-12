const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { soptype } = req.query;

    let filter = {};

    if (soptype) {
      filter = {
        where: { soptype: soptype },
      };
    }

    const doctype = await prisma.docType.findMany(filter);

    res.json(doctype);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
