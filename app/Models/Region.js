const { Schema } = require('mongoose');
const { connect } = require("../Mongo");
const Axe = require("./Axe");

const db = connect();

const RegionSchema = new Schema({
    codeRegion: { type: String, required: true },
    axes: [Axe]
});

module.exports = db.model('Region', RegionSchema);
