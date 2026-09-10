const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const {
      departmentId,
      search,
      startDate,
      endDate,
      doctypeId,
      page,
      limit,
    } = req.query;

    // แปลงค่า page & limit เป็นตัวเลข
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 10;

    // คำนวณค่าการแบ่งหน้า
    const skip = (pageNumber - 1) * pageSize;
    const take = pageSize;

    // สร้างเงื่อนไข where
    const where = {};

    if (Number(req.user?.roleId) === 6) {
      where.creator = {
        employee: {
          departmentId: Number(req.user?.employee?.departmentId),
        },
      };
    } else if (Number(req.user?.roleId) === 7) {
      where.creator = {
        employee: {
          divisionId: Number(req.user?.employee?.divisionId),
        },
      };
    } else if (Number(req.user?.roleId) === 8) {
      where.creator = {
        employee: {
          officeId: Number(req.user?.employee?.officeId),
        },
      };
    } else if (Number(req.user?.roleId) === 1) {
      if (departmentId && Number(departmentId) > 0) {
        where.creator = {
          employee: {
            departmentId: Number(departmentId),
          },
        };
      }
    }

    if (doctypeId && Number(doctypeId) > 0) {
      where.doctypeId = Number(doctypeId);
    }

    if (search) {
      where.OR = [
        { docdt_no: { contains: search, mode: "insensitive" } },
        { docdt_title: { contains: search, mode: "insensitive" } },
      ];
    }

    if (startDate && endDate) {
      const sDate = new Date(`${startDate}T00:00:00+07:00`);
      const eDate = new Date(`${endDate}T23:59:59+07:00`);

      where.createdAt = {
        gte: new Date(sDate.toISOString()),
        lte: new Date(eDate.toISOString()),
      };
    }

    const docdirectors = await prisma.docDirector.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        priority: true,
        doctype: true,
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
                departmentId: true,
                divisionId: true,
                officeId: true,
                unitId: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.docDirector.count({ where });

    // Format dates
    const formattedDocs = docdirectors.map((doc) => ({
      docdtId: doc.id,
      ...doc,
      createdAt: moment(doc.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(doc.updatedAt).tz("Asia/Vientiane").format(),
    }));

    res.json({
      total,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
      formattedDocs,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
