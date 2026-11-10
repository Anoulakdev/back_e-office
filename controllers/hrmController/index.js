const department = require("./syncDepartment");
const division = require("./syncDivision");
const office = require("./syncOffice");
const unit = require("./syncUnit");
const subunit = require("./syncSubunit");
const positiongroup = require("./syncPositionGroup");
const positioncode = require("./syncPositionCode");
const position = require("./syncPosition");
const employee = require("./syncEmployee");

module.exports = {
  department,
  division,
  office,
  unit,
  subunit,
  positiongroup,
  positioncode,
  position,
  employee,
};
