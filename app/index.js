const express = require("express");
const cors = require("cors");
const dotenv = require('dotenv');

const City = require("./Models/City");
const Region = require("./Models/Region");


dotenv.config();
const app = express();

app.use(express.json());

app.use(cors());

app.get('/score/city/:cityCode', async (req, res) => {
    const city = await City.findOne({codeCommune: req.params.cityCode});
    if (city === null)
        return res.sendStatus(404);

    const region = await Region.findOne({codeRegion: city.codeRegion});
    if (region === null)
        return res.sendStatus(404);

    const axesResJson = [];
    const resJson = {axes: axesResJson, score: null};

    for (const axe of city.axes) {
        const axeResJon = {...axe._doc, score: null, indices: []};
        let foundAxeR = null;
        for (const axeR of region.axes) {
            if (axeR.nom === axe.nom) {
                foundAxeR = axeR;
                break;
            }
        }
        if (!foundAxeR)
            return res.sendStatus(500);

        for (const indice of axe.indices) {
            let foundIndiceR = null;
            for (const indiceR of foundAxeR.indices) {
                if (indiceR.nom === indice.nom) {
                    foundIndiceR = indiceR;
                    break;
                }
            }
            if (!foundIndiceR)
                return res.sendStatus(500);

            axeResJon.indices.push({
                nom: indice.nom,
                score: ((indice.value-foundIndiceR.value)/foundIndiceR.value + 1) * 100
            });
        }
        axeResJon.score = axeResJon.indices.reduce((acc,indice) => acc+indice.score, 0)/axeResJon.indices.length

        console.log("push");
        console.log(axeResJon);
        axesResJson.push(axeResJon);
    }
    resJson.score = axesResJson.reduce((acc,axe) => acc+axe.score, 0)/axesResJson.length
    console.log("finish");
    console.log(resJson);
    res.json(resJson);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.info("back listening on port " + PORT));
