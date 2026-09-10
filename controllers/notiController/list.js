const prisma = require("../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const where = {
      receiverCode: username,
      viewed: false,
    };

    // ดึงข้อมูลและนับจำนวนพร้อมกันแบบ Parallel (DocexTracking, DocinTracking, DocdtTracking)
    const [
      docexCount,
      docexTrackings,
      docinCount,
      docinTrackings,
      docdtCount,
      docdtTrackings,
    ] = await Promise.all([
      prisma.docexTracking.count({ where }),
      prisma.docexTracking.findMany({
        where,
        include: {
          docstatus: true,
          docexternal: {
            include: {
              priority: true,
              doctype: true,
              outsider: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.docinTracking.count({ where }),
      prisma.docinTracking.findMany({
        where,
        include: {
          docstatus: true,
          docinternal: {
            include: {
              priority: true,
              doctype: true,
              fromDepartment: true,
              fromDivision: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.docdtTracking.count({ where }),
      prisma.docdtTracking.findMany({
        where,
        include: {
          docstatus: true,
          docdirector: {
            include: {
              priority: true,
              doctype: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Format dates ตาม timezone
    const formatTracking = (list, docRelationKey) =>
      list.map((doc) => ({
        ...doc,
        createdAt: moment(doc.createdAt).tz("Asia/Vientiane").format(),
        updatedAt: moment(doc.updatedAt).tz("Asia/Vientiane").format(),
        [docRelationKey]: doc[docRelationKey]
          ? {
            ...doc[docRelationKey],
            createdAt: moment(doc[docRelationKey].createdAt)
              .tz("Asia/Vientiane")
              .format(),
            updatedAt: moment(doc[docRelationKey].updatedAt)
              .tz("Asia/Vientiane")
              .format(),
          }
          : null,
      }));

    const formattedDocex = formatTracking(docexTrackings, "docexternal");
    const formattedDocin = formatTracking(docinTrackings, "docinternal");
    const formattedDocdt = formatTracking(docdtTrackings, "docdirector");

    const totalAll = docexCount + docinCount + docdtCount;

    res.status(200).json({
      total: totalAll,
      docexternal: {
        count: docexCount,
        data: formattedDocex,
      },
      docinternal: {
        count: docinCount,
        data: formattedDocin,
      },
      docdirector: {
        count: docdtCount,
        data: formattedDocdt,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
