const express = require("express");
const cors = require("cors");
const dotenv = require('dotenv');


dotenv.config();
const app = express();

app.use(express.json());

app.use(cors());

app.get('/get200', (req, res) => {
    res.status(200).send('ok');
});

app.use(express.static('front'))

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.info("back listening on port " + PORT));
