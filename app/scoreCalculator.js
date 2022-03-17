async function calculCityOrDepartmentScore(res, region, elem) {
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
        if (!foundAxeR) {
            res.sendStatus(500);
            return false;
        }

        for (const indice of axe.indices) {
            let foundIndiceR = null;
            for (const indiceR of foundAxeR.indices) {
                if (indiceR.nom === indice.nom) {
                    foundIndiceR = indiceR;
                    break;
                }
            }
            if (!foundIndiceR) {
                res.sendStatus(500);
                return false;
            }

            axeResJon.indices.push({
                nom: indice.nom,
                score: ((indice.value-foundIndiceR.value)/foundIndiceR.value + 1) * 100
            });
        }
        axeResJon.score = axeResJon.indices.reduce((acc,indice) => acc+indice.score, 0)/axeResJon.indices.length

        axesResJson.push(axeResJon);
    }
    resJson.score = axesResJson.reduce((acc,axe) => acc+axe.score, 0)/axesResJson.length
    return resJson;
}

module.exports = {calculCityOrDepartmentScore};