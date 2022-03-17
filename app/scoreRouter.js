const City = require("./Models/City");
const Departement = require("./Models/Departement");
const Region = require("./Models/Region");
const {calculCityOrDepartmentScore} = require("./scoreCalculator");
const {Router} = require("express");

const router = Router();

router.get("/city/:code", async (req, res) => {
    const city = await City.findOne({codeCommune: req.params.code});
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
    if (!(cityScores = await calculCityOrDepartmentScore(res,region,city)))
        return;

    let departementScores;
    if (!(departementScores = await calculCityOrDepartmentScore(res,region,department)))
        return;

    res.json({city: {...cityScores, name: city.nom}, department: {...departementScores, code: department.codeDepartement}})
});

module.exports = router;