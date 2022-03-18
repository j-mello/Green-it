const fs = require("fs");
const indicesConfig = require("./indicesConfig");
const City = require("./Models/City");
const Departement = require("./Models/Departement");
const Region = require("./Models/Region");

String.prototype.split = function(delimiter, detectQuotes = false) {
    const value = this.valueOf();
    const arr = [];
    let substr = "";
    let quote = null;
    for (const char of value) {
        if (!detectQuotes || quote === null) {
            if (char === delimiter) {
                arr.push(substr);
                substr = "";
                continue;
            }
            if (detectQuotes && char === '"') {
                quote = char;
                continue
            }
        }
        if (detectQuotes && quote === char) {
            quote = null;
            continue;
        }
        substr += char;
    }
    arr.push(substr);

    return arr;
}

String.prototype.addMissingZeros = function(n = 5) {
    let value = this.valueOf();
    while (value.length < n) {
        value = '0'+value;
    }
    return value;
}

async function saveRegion(region, indices) {
    for (const axe of region.axes) {
        for (const indice of axe.indices) {
            if (indices[indice.nom]) {
                indice.value = indice.set.reduce((acc, val) => acc + val, 0) / indice.set.length;
            }
        }
    }
    await region.save();
}

async function saveDepartement(departement, region, indices) {
    for (const axe of departement.axes) {
        let foundAxeR = null;
        for (const axeR of region.axes) {
            if (axeR.nom === axe.nom) {
                foundAxeR = axeR;
                break;
            }
        }
        for (const indice of axe.indices) {
            if (indices[indice.nom]) {
                indice.value = indice.set.reduce((acc, val) => acc + val, 0) / indice.set.length;

                if (foundAxeR) {
                    let indiceFound = false;
                    for (const indiceR of foundAxeR.indices) {
                        if (indiceR.nom === indice.nom) {
                            if (indiceR.set === null) {
                                console.log(departement);
                                console.log(region);
                            }
                            indiceR.set.push(indice.value);
                            indiceFound = true;
                            break;
                        }
                    }
                    if (!indiceFound) {
                        foundAxeR.indices.push({
                            nom: indice.nom,
                            value: null,
                            set: [indice.value]
                        })
                    }
                } else {
                    region.axes.push({
                        nom: axe.nom,
                        indices: [{
                            nom: indice.nom,
                            value: null,
                            set: [indice.value]
                        }]
                    });
                    foundAxeR = region.axes[region.axes.length - 1];
                }
            }
            await region.save();
        }
    }
    await departement.save();
}

async function saveCity(city,departement,indices) {
    for (const axe of city.axes) {
        let foundAxeD = null;
        if (departement) {
            for (const axeD of departement.axes) {
                if (axeD.nom === axe.nom) {
                    foundAxeD = axeD;
                    break;
                }
            }
        }
        let indicesDeleted = false;
        for (let i=0;i<axe.indices.length;i++) {
            const indice = axe.indices[i];

            if (indices[indice.nom]) {
                if (!indice.set || indice.set.length === 0) {
                    axe.indices.splice(i,1);
                    indicesDeleted = true;
                    i --;
                    continue;
                }
                indice.value = indice.set.reduce((acc,val) => acc+val, 0)/indice.set.length;

                if (foundAxeD) {
                    let indiceFound = false;
                    for (const indiceD of foundAxeD.indices) {
                        if (indiceD.nom === indice.nom) {
                            indiceD.set.push(indice.value);
                            indiceFound = true;
                            break;
                        }
                    }
                    if (!indiceFound) {
                        foundAxeD.indices.push({
                            nom: indice.nom,
                            value: null,
                            set: [indice.value]
                        });
                    }
                } else if (departement) {
                    departement.axes.push({
                        nom: axe.nom,
                        indices: [{
                            nom: indice.nom,
                            value: null,
                            set: [indice.value]
                        }]
                    });
                    foundAxeD = departement.axes[departement.axes.length-1];
                }
            }
            if (departement) {
                await departement.save();
            }
        }
        if (indicesDeleted) {
            await city.save();
        }
    }
    let axesDeleted = false;
    for (let i=0;i<city.axes.length;i++) {
        const axe = city.axes[i];
        if (axe.indices.length === 0) {
            city.axes.splice(i,1);
            axesDeleted = true;
            i --;
        }
    }
    await city.save();
}

async function generateDatabase() {
    await City.deleteMany({});
    await Departement.deleteMany({});
    await Region.deleteMany({});
    console.log("database purged");

    const path = __dirname+"/docs/";
    for (const [dir, {files,colsName,totalNbPeopleCols}] of Object.entries(indicesConfig.foldersConfig)) {
        if (!files)
            continue;

        const indices = {};

        const colNamesConfig = colsName ?? indicesConfig.foldersConfig.default.colsName;

        let cols = [colNamesConfig.codeCommune, colNamesConfig.nameCommune, 'Département', 'Région', ...(totalNbPeopleCols??[])];
        for (const axe of indicesConfig.axes) {
            for (const indice of axe.indices) {
                if (indice.docFolder === dir) {
                    indices[indice.name] = {
                        ...indice,
                        axeName: axe.name
                    }
                    cols = [...cols, ...indice.cols];
                }
            }
        }

        for (const file of files) {
            await (() => new Promise(resolve => {
                console.log("read "+file);
                const stream = fs.createReadStream(path+dir+"/"+file, {encoding: 'utf8'});

                let city = null;
                let departement = null
                let region = null;

                let axesByName = {};
                let indicesByNameAndAxeName = {};

                const indexByColName = {};
                let i = 0;

                const eachLine = async data => {
                    if (data.trim() === '')
                        return;
                    if (i%500 === 0) {
                        console.log("line "+i);
                    }
                    if (i === 0) {
                        for (const [i,colname] of Object.entries(data.split(",", true))) {
                            if (cols.includes(colname)) {
                                indexByColName[colname] = parseInt(i);
                            }
                        }
                        i ++;
                        return;
                    }
                    if (i === 1) {
                        i ++;
                        return;
                    }

                    const line = data.split(",", true);
                    if (city === null || city.codeCommune !== line[indexByColName[colNamesConfig.codeCommune]]) {
                        if (city !== null) {
                            await saveCity(city,departement,indices);
                        }
                        axesByName = {};
                        indicesByNameAndAxeName = {};

                        const codeCommune = line[indexByColName[colNamesConfig.codeCommune]].addMissingZeros();

                        city = await City.findOne({codeCommune});
                        if (city === null) {
                            city = await City.create({
                                nom: line[indexByColName[colNamesConfig.nameCommune]],
                                nom_lower: line[indexByColName[colNamesConfig.nameCommune]].toLowerCase(),
                                codeCommune,
                                codeDepartement: line[indexByColName['Département']]??null,
                                codeRegion: line[indexByColName['Région']]??"com",
                                axes: []
                            });
                        }
                    }
                    if (city.codeDepartement && (departement === null || city.codeDepartement !== departement.codeDepartement)) {
                        if (departement !== null) {
                            await saveDepartement(departement, region, indices);
                        }
                        departement = await Departement.findOne({codeDepartement: city.codeDepartement});
                        if (departement === null) {
                            departement = await Departement.create({
                                codeDepartement: city.codeDepartement,
                                codeRegion: city.codeRegion,
                                axes: []
                            });
                        }
                    } else if (city.codeDepartement === null) {
                        departement = null;
                    }
                    if (departement && (region === null || city.codeRegion !== region.codeRegion)) {
                        if (region !== null) {
                            await saveRegion(region,indices);
                        }
                        region = await Region.findOne({codeRegion: city.codeRegion});
                        if (region === null) {
                            region = await Region.create({
                                codeRegion: city.codeRegion,
                                axes: []
                            });
                        }
                    }

                    for (const indice of Object.values(indices)) {
                        if (axesByName[indice.axeName] === undefined) {
                            axesByName[indice.axeName] = city.axes.find(axe => axe.nom === indice.axeName);
                            if (axesByName[indice.axeName] === undefined) {
                                city.axes.push({
                                    nom: indice.axeName,
                                    indices: []
                                });
                                axesByName[indice.axeName] = city.axes[city.axes.length - 1];
                                await city.save();
                            }
                        }
                        const axe = axesByName[indice.axeName];
                        if (indicesByNameAndAxeName[axe.name] === undefined) {
                            indicesByNameAndAxeName[axe.name] = {};
                        }
                        if (indicesByNameAndAxeName[axe.name][indice.name] === undefined) {
                            indicesByNameAndAxeName[axe.name][indice.name] = axe.indices.find(eachIndice => eachIndice.nom === indice.name);
                            if (indicesByNameAndAxeName[axe.name][indice.name] === undefined) {
                                axe.indices.push({
                                    nom: indice.name,
                                    value: null,
                                    set: [],
                                    coef: indice.coef
                                });
                                indicesByNameAndAxeName[axe.name][indice.name] = axe.indices[axe.indices.length - 1];
                            }
                        }

                        let value = indice.cols.reduce((acc,col) => {
                            const n = parseFloat(line[indexByColName[col]]);
                            return acc+n;
                        } , 0);
                        if (!isNaN(value) && indice.divideWithTotalNbPeople && totalNbPeopleCols) {
                            let totalPeople = totalNbPeopleCols.reduce((acc,col) => acc+parseFloat(line[indexByColName[col]]), 0);
                            value = (!isNaN(totalPeople) && totalPeople !== 0) ? value/totalNbPeopleCols.reduce((acc,col) => acc+parseFloat(line[indexByColName[col]]), 0) : NaN;
                            if (!isNaN(value) && value > 1) {
                                value = 1;
                            }
                        }
                        if (!isNaN(value)) {
                            if (indicesByNameAndAxeName[axe.name][indice.name].set === null) {
                                console.log("set null in "+city.nom+" ("+city.codeCommune+")");
                            }
                            indicesByNameAndAxeName[axe.name][indice.name].set.push(value);
                        }

                        await city.save();
                    }
                    i ++;
                }

                const onClose = async () => {
                    console.log("finished "+file);
                    if (city) {
                        await saveCity(city,departement,indices);
                    }
                    if (departement) {
                        await saveDepartement(departement, region, indices);
                    }
                    if (region) {
                        await saveRegion(region, indices);
                    }
                    resolve();
                }

                let finished = false;
                let paused = false;

                let currentLines = "";
                stream.on('data', async data => {
                    currentLines += data;
                    let lines;
                    if ((lines = currentLines.split("\n")).length > 1) {
                        currentLines = lines[lines.length-1];
                        lines = lines.slice(0,-1);
                        stream.pause();
                        paused = true;
                        for (const line of lines) {
                            await eachLine(line);
                        }
                        stream.resume();
                        paused = false;
                        if (finished)
                            onClose();
                    }
                });

                stream.on('end', async () => {
                    await eachLine(currentLines);
                    finished = true;
                    if (!paused)
                        onClose();
                })
            }))();
        }
    }

    console.log("FINISH");
}

generateDatabase();