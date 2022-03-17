const express = require("express");
const cors = require("cors");
const dotenv = require('dotenv');
const scoreRouter = require("./scoreRouter");


dotenv.config();
const app = express();

app.use(express.json());

app.use(cors());

app.use("/score", scoreRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.info("back listening on port " + PORT));
