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
        orderBy: [{ createdAt: "asc" }],
        include: {
          docstatus: true,
          assigner: {
            select: {
              username: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  gender: true,
                  tel: true,
                  position: true,
                  department: {
                    select: { id: true, department_name: true },
                  },
                  division: {
                    select: {
                      id: true,
                      division_name: true,
                      branch_id: true, // เพิ่ม branch_id
                    },
                  },
                  office: {
                    select: {
                      id: true,
                      office_name: true,
                    },
                  },
                },
              },
            },
          },
          receiver: {
            select: {
              username: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  gender: true,
                  tel: true,
                  position: true,
                  department: {
                    select: { id: true, department_name: true },
                  },
                  division: {
                    select: {
                      id: true,
                      division_name: true,
                      branch_id: true, // เพิ่ม branch_id
                    },
                  },
                  office: {
                    select: {
                      id: true,
                      office_name: true,
                    },
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

      const groupedData = docexlogs.reduce((acc, log) => {
        const emp = log.receiver?.employee || log.assigner?.employee;

        const deptInfo = emp?.department;
        const divisionInfo = emp?.division;
        const officeInfo = emp?.office;
        const branchId = divisionInfo?.branch_id || 1;

        const deptId = deptInfo?.id || "Unknown";
        const deptName = deptInfo?.department_name || "Unknown";
        const deptActive = log.departmentactive ?? 0;

        const divisionId = divisionInfo?.id || "Unknown";
        const divisionName = divisionInfo?.division_name || "Unknown";
        const divisionActive = log.divisionactive ?? 0;

        const officeId = officeInfo?.id || "Unknown";
        const officeName = officeInfo?.office_name || "Unknown";
        const officeActive = log.officeactive ?? 0;

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
              divisionId,
              division_name: divisionName,
              divisionactive: divisionActive,
              ...(branchId === 2 ? { offices: [] } : { logs: [] }),
            };
            departmentGroup.divisions.push(divisionGroup);
          }

          if (branchId === 2) {
            // Find or create office group inside division
            let officeGroup = divisionGroup.offices.find(
              (o) => o.officeId === officeId
            );

            if (!officeGroup) {
              officeGroup = {
                officeId,
                office_name: officeName,
                officeactive: officeActive,
                logs: [],
              };
              divisionGroup.offices.push(officeGroup);
            }

            officeGroup.logs.push(formattedLog);
          } else {
            divisionGroup.logs.push(formattedLog);
          }
        }

        return acc;
      }, []);

      // Sort groupedData
      groupedData.sort((a, b) => {
        if (a.departmentId === 15) return -1;
        if (b.departmentId === 15) return 1;

        return a.departmentactive - b.departmentactive;
      });

      // Sort divisions and offices
      groupedData.forEach((department) => {
        if (department.divisions) {
          department.divisions.sort(
            (a, b) => a.divisionactive - b.divisionactive
          );

          department.divisions.forEach((division) => {
            if (division.offices) {
              division.offices.sort((a, b) => a.officeactive - b.officeactive);
            }
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
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  gender: true,
                  tel: true,
                  position: true,
                },
              },
            },
          },
          receiver: {
            select: {
              username: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  gender: true,
                  tel: true,
                  position: true,
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
