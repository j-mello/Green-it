const { Schema } = require('mongoose');

const IndiceSchema = new Schema({
    nom: { type: String, required: true },
    value: { type: Number, required: true },
    score: { type: Number, required: false }
});

module.exports = IndiceSchema;