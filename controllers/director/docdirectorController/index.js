const create = require("./create");
const list = require("./list");
const getById = require("./getById");
const getdocument = require("./getdocument");
const update = require("./update");
const remove = require("./remove");
const assign = require("./assign");
const listdepartment = require("./listdepartment");
const removeall = require("./removeall");

module.exports = {
    create,
    list,
    getById,
    update,
    remove,
    assign,
    getdocument,
    listdepartment,
    removeall,
};
