const { Schema } = require('mongoose');
const { connect } = require("../Mongo");
const Axe = require("./Axe");

const db = connect();

const CitySchema = new Schema({
    nom: { type: String, required: true },
    nom_lower: { type: String, required: true },
    codeCommune: { type: String, required: true },
    codeDepartement: { type: String, required: false },
    codeRegion: { type: String, required: true },
    axes: [Axe]
});

module.exports = db.model('City', CitySchema);
