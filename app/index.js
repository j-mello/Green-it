const express = require("express");
const cors = require("cors");
const dotenv = require('dotenv');
const generateDatabase = require('./generateDatabase');

generateDatabase();

dotenv.config();
const app = express();

app.use(express.json());

app.use(cors());

app.get('/', (req, res) => {
    res.status(200).send('ok');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.info("back listening on port " + PORT));
