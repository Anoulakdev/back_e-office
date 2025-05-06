const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const { docexId } = req.params;

    // Validate docexId is a number
    if (isNaN(Number(docexId))) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    const docexs = await prisma.docExternal.findUnique({
      where: {
        id: Number(docexId),
      },
    });

    if (docexs.extype === 1) {
      const docexlogs = await prisma.docexLog.findMany({
        where: {
          docexId: Number(docexId),
        },
        orderBy: [
          { createdAt: "asc" }, // ไม่ต้อง order จาก department เพราะเราจะ group เอง
        ],
        include: {
          docstatus: true,
          assigner: {
            select: {
              username: true,
              name: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  gender: true,
                  tel: true,
                  department: {
                    select: { id: true, department_name: true },
                  },
                  division: {
                    select: { id: true, division_name: true },
                  },
                },
              },
            },
          },
          receiver: {
            select: {
              username: true,
              name: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  gender: true,
                  tel: true,
                  department: {
                    select: { id: true, department_name: true },
                  },
                  division: {
                    select: { id: true, division_name: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!docexlogs.length) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Group data by department and division
      const groupedData = docexlogs.reduce((acc, log) => {
        const deptInfo =
          log.receiver?.employee?.department ||
          log.assigner?.employee?.department;
        const divisionInfo =
          log.receiver?.employee?.division || log.assigner?.employee?.division;

        const deptId = deptInfo?.id || "Unknown";
        const deptName = deptInfo?.department_name || "Unknown";
        const deptActive = log.departmentactive ?? 0; // <-- ดึงจาก log โดยตรง

        const divisionId = divisionInfo?.id || "Unknown";
        const divisionName = divisionInfo?.division_name || "Unknown";
        const divisionActive = log.divisionactive ?? 0; // <-- ดึงจาก log โดยตรง

        // Find or create department group
        let departmentGroup = acc.find((d) => d.departmentId === deptId);
        if (!departmentGroup) {
          departmentGroup = {
            departmentId: deptId,
            department_name: deptName,
            departmentactive: deptActive,
            ...(deptId === 15 ? { logs: [] } : { divisions: [] }),
          };
          acc.push(departmentGroup);
        }

        // Format log entry
        const formattedLog = {
          ...log,
          createdAt: moment(log.createdAt).tz("Asia/Vientiane").format(),
          updatedAt: moment(log.updatedAt).tz("Asia/Vientiane").format(),
        };

        if (deptId === 15) {
          departmentGroup.logs.push(formattedLog);
        } else {
          // Find or create division group
          let divisionGroup = departmentGroup.divisions.find(
            (d) => d.divisionId === divisionId
          );

          if (!divisionGroup) {
            divisionGroup = {
              divisionId: divisionId,
              division_name: divisionName,
              divisionactive: divisionActive,
              logs: [],
            };
            departmentGroup.divisions.push(divisionGroup);
          }

          divisionGroup.logs.push(formattedLog);
        }

        return acc;
      }, []);

      // Sort groupedData
      groupedData.sort((a, b) => {
        if (a.departmentId === 15) return -1; // departmentId 15 ขึ้นก่อน
        if (b.departmentId === 15) return 1;

        // เรียงตาม departmentactive
        if (a.departmentactive !== b.departmentactive) {
          return a.departmentactive - b.departmentactive;
        }

        return 0;
      });

      // Sort divisions inside each department
      groupedData.forEach((department) => {
        if (department.divisions) {
          department.divisions.sort((a, b) => {
            if (a.divisionactive !== b.divisionactive) {
              return a.divisionactive - b.divisionactive;
            }
            return 0;
          });
        }
      });

      res.json({ groupedLogs: groupedData });
    } else if (docexs.extype === 2) {
      const docex = await prisma.docexLog.findMany({
        where: {
          docexId: Number(docexId),
        },
        include: {
          docstatus: true,
          assigner: {
            select: {
              username: true,
              name: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  gender: true,
                  tel: true,
                },
              },
            },
          },
          receiver: {
            select: {
              username: true,
              name: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  gender: true,
                  tel: true,
                },
              },
            },
          },
        },
      });

      if (!docex || docex.length === 0) {
        return res.status(404).json({ message: "document not found" });
      }

      // Format all logs
      const formattedLogs = docex.map((log) => ({
        ...log,
        createdAt: moment(log.createdAt).tz("Asia/Vientiane").format(),
        updatedAt: moment(log.updatedAt).tz("Asia/Vientiane").format(),
      }));

      res.json(formattedLogs);
    }
  } catch (err) {
    console.error("Error in gethistory:", err);
    res.status(500).json({
      message: "Server Error",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};
