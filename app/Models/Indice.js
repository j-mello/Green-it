const { Schema } = require('mongoose');

const IndiceSchema = new Schema({
    nom: { type: String, required: true },
    value: { type: Number, required: false },
    set: {type: Array, required: false }
});

module.exports = IndiceSchema;