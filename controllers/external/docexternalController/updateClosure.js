const prisma = require("../../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { docexternalId } = req.params;
    const { closureStatusId } = req.body;

    if (!docexternalId) {
      return res.status(400).json({ message: "docex external Id is required" });
    }

    if (closureStatusId === undefined || closureStatusId === null) {
      return res.status(400).json({ message: "closureStatusId is required" });
    }

    // Step 1: Check if the document exists
    const docex = await prisma.docExternal.findUnique({
      where: {
        id: Number(docexternalId),
      },
    });

    if (!docex) {
      return res.status(404).json({ message: "Document not found" });
    }

    const statusId = Number(closureStatusId);

    // Step 2: If status is 3, delete all trackings for this document
    if (statusId === 3) {
      await prisma.docexTracking.deleteMany({
        where: {
          docexId: Number(docexternalId),
        },
      });
    }

    // Step 3: Update closureStatusId
    const updated = await prisma.docExternal.update({
      where: {
        id: Number(docexternalId),
      },
      data: {
        closureStatusId: statusId,
      },
      include: {
        closureStatus: true,
      },
    });

    res.status(200).json({ message: "Update successful!", data: updated });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
