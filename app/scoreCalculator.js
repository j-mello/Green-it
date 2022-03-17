const Region = require("./Models/Region");

async function calculateCityOrDepartementScore(res,elem) {
    const region = await Region.findOne({codeRegion: elem.codeRegion});
    if (region === null)
        return res.sendStatus(404);

    const axesResJson = [];
    const resJson = {axes: axesResJson, score: null};

    for (const axe of elem.axes) {
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

        axesResJson.push(axeResJon);
    }
    resJson.score = axesResJson.reduce((acc,axe) => acc+axe.score, 0)/axesResJson.length
    res.json(resJson);
}

module.exports = {calculateCityOrDepartementScore};