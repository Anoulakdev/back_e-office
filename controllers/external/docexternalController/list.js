const fs = require("fs");
const prisma = require("../../../prisma/prisma");
const multer = require("multer");
const path = require("path");
const moment = require("moment-timezone");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/document");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }).single("docex_file");

module.exports = async (req, res) => {
  try {
    const {
      search,
      priority,
      outsider,
      assignto,
      // extype,
      selectDateStart,
      selectDateEnd,
      // page,
      // limit,
    } = req.query;

    // แปลงค่า page & limit เป็นตัวเลข
    // const pageNumber = Number(page) || 1;
    // const pageSize = Number(limit) || 10;

    // คำนวณค่าการแบ่งหน้า
    // const skip = (pageNumber - 1) * pageSize;
    // const take = pageSize;

    // สร้างเงื่อนไข where
    let where = {};

    if (req.user.roleId === 2) {
      where.extype = 1;
    } else {
      where.creatorCode = req.user.username;
    }

    if (search) {
      where.OR = [
        { docex_no: { contains: search, mode: "insensitive" } },
        { docex_title: { contains: search, mode: "insensitive" } },
      ];
    }

    if (priority) {
      where.priorityId = Number(priority);
    }

    // if (extype) {
    //   where.extype = Number(extype);
    // }

    if (assignto) {
      where.assignto = Number(assignto);
    } else if (assignto === null || assignto === "null") {
      where.assignto = null;
    }

    if (outsider) {
      where.outsider = {
        is: {
          name: { contains: outsider, mode: "insensitive" },
        },
      };
    }

    if (selectDateStart && selectDateEnd) {
      const startDate = new Date(`${selectDateStart}T00:00:00+07:00`);

      const endDate = new Date(`${selectDateEnd}T23:59:59+07:00`);

      where.createdAt = {
        gte: new Date(startDate.toISOString()),
        lte: new Date(endDate.toISOString()),
      };
    }

    const docexternals = await prisma.docExternal.findMany({
      where,
      // skip,
      // take,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        docexlogs: {
          include: {
            docstatus: true,
          },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        priority: true,
        doctype: true,
        outsider: {
          include: {
            belongto: true,
          },
        },
        creator: {
          select: {
            username: true,
            employee: {
              select: {
                first_name: true,
                last_name: true,
                emp_code: true,
                gender: true,
                tel: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // const total = await prisma.docExternal.count({ where });

    // Format dates
    const formattedDocs = docexternals.map((doc) => ({
      ...doc,
      createdAt: moment(doc.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(doc.updatedAt).tz("Asia/Vientiane").format(),
    }));

    res.json(formattedDocs);

    // res.json({
    //   total,
    //   page: pageNumber,
    //   limit: pageSize,
    //   totalPages: Math.ceil(total / pageSize),
    //   formattedDocs,
    // });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
