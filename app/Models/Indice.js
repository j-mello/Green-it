const { Schema } = require('mongoose');

const IndiceSchema = new Schema({
    nom: { type: String, required: true },
    value: { type: Number, required: false },
    set: {type: Array, required: false },
    coef: {type: Number, default: 1}
});

module.exports = IndiceSchema;