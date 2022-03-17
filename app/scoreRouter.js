const City = require("./Models/City");
const Departement = require("./Models/Departement");
const {calculateCityOrDepartementScore} = require("./scoreCalculator");
const {Router} = require("express");

const router = Router();

router.get("/city/:code", async (req, res) => {
    const city = await City.findOne({codeCommune: req.params.code});
    if (city === null)
        return res.sendStatus(404);

    calculateCityOrDepartementScore(res,city);
});

router.get("/department/:code", async (req, res) => {
    const department = await Departement.findOne({codeDepartement: req.params.code});
    if (department === null)
        return res.sendStatus(404);

    calculateCityOrDepartementScore(res,department);
});

module.exports = router;