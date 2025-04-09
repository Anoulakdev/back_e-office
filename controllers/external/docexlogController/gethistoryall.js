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
          { receiver: { department: { id: "desc" } } },
          { createdAt: "asc" },
          // { departmentactive: "asc" }
        ],
        include: {
          docstatus: true,
          assigner: {
            select: {
              first_name: true,
              last_name: true,
              gender: true,
              department: {
                select: { id: true, department_name: true },
              },
              division: {
                select: { id: true, division_name: true },
              },
            },
          },
          receiver: {
            select: {
              first_name: true,
              last_name: true,
              gender: true,
              department: {
                select: { id: true, department_name: true },
              },
              division: {
                select: { id: true, division_name: true },
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
        // Determine department info (prefer receiver over assigner)
        const deptInfo = log.receiver?.department || log.assigner?.department;
        const divisionInfo = log.receiver?.division || log.assigner?.division;

        const deptId = deptInfo?.id || "Unknown";
        const deptName = deptInfo?.department_name || "Unknown";
        const divisionName = divisionInfo?.division_name || "Unknown";

        // Find or create department group
        let departmentGroup = acc.find((d) => d.departmentId === deptId);
        if (!departmentGroup) {
          departmentGroup = {
            departmentId: deptId,
            department_name: deptName,
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

        // Handle department 15 (special case) or other departments
        if (deptId === 15) {
          departmentGroup.logs.push(formattedLog);
        } else {
          // Find or create division group
          let divisionGroup = departmentGroup.divisions.find(
            (d) => d.division_name === divisionName
          );

          if (!divisionGroup) {
            divisionGroup = {
              division_name: divisionName,
              logs: [],
            };
            departmentGroup.divisions.push(divisionGroup);
          }

          divisionGroup.logs.push(formattedLog);
        }

        return acc;
      }, []);

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
              first_name: true,
              last_name: true,
              gender: true,
            },
          },
          receiver: {
            select: {
              first_name: true,
              last_name: true,
              gender: true,
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
