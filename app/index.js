const City = require("./Models/City");
const Departement = require("./Models/Departement");
const Region = require("./Models/Region");
const {calculCityOrDepartmentScore, getRegionValues} = require("./scoreCalculator");

const express = require("express");
const cors = require("cors");
const dotenv = require('dotenv');


dotenv.config();
const app = express();

app.use(express.json());

app.use(cors());

app.get("/score/:codeOrNameCommune", async (req, res) => {
    const {codeOrNameCommune} = req.params;
    const city = await City.findOne({$or: [{codeCommune: codeOrNameCommune}, {nom_lower: codeOrNameCommune.toLowerCase()}] });
    if (city === null)
        return res.sendStatus(404);

    const department = await Departement.findOne({codeDepartement: city.codeDepartement});
    if (department === null)
        return res.sendStatus(404);

    const region = await Region.findOne({codeRegion: city.codeRegion});
    if (region === null) {
        res.sendStatus(404);
        return false;
    }

    let cityScores;
    if (!(cityScores = calculCityOrDepartmentScore(res, region, city)))
        return;

    let departementScores;
    if (!(departementScores = calculCityOrDepartmentScore(res, region, department)))
        return;

    res.json({
        city: {name: city.nom, ...cityScores},
        department: {name: department.codeDepartement, ...departementScores},
        region: getRegionValues(region)
    })
})

app.use(express.static('front'))

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.info("back listening on port " + PORT));
