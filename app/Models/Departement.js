const { Schema } = require('mongoose');
const { connect } = require("../Mongo");
const Axe = require("./Axe");

const db = connect();

const DepartementSchema = new Schema({
    codeDepartement: { type: String, required: true },
    codeRegion: {type: String, required: true},
    axes: [Axe]
});

module.exports = db.model('Departement', DepartementSchema);
