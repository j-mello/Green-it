const { Schema } = require('mongoose');
const Indice = require("./Indice");

const AxeSchema = new Schema({
    nom: { type: String, required: true },
    indices: [Indice]
});

module.exports = AxeSchema;