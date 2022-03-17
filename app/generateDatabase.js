const fs = require("fs");
const indicesConfig = require("./indicesConfig");
const City = require("./Models/City");
const Departement = require("./Models/Departement");

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

async function saveDepartement(departement, indices) {
    for (const axe of departement.axes) {
        for (const indice of axe.indices) {
            if (indices[indice.nom] && indice.value === null) {
                indice.value = indices[indice.nom].aggregate(indice.set);
            }
        }
    }
    try {
        await departement.save();
    } catch(e) {
        console.log("save departement failed");
        const oldDepartement = await Departement.findOne({codeDepartement: departement.codeDepartement})
        console.log("old departement =>")
        console.log(JSON.stringify(oldDepartement,null,"\t"));
        console.log("new departement =>");
        console.log(JSON.stringify(departement,null,"\t"));
        throw e;
    }
}

async function saveCity(city,departement,indices) {
    for (const axe of city.axes) {
        let foundAxeD = null;
        for (const axeD of departement.axes) {
            if (axeD.nom === axe.nom) {
                foundAxeD = axeD;
                break;
            }
        }
        for (const indice of axe.indices) {
            if (indices[indice.nom] && indice.value === null) {
                indice.value = indices[indice.nom].aggregate(indice.set);

                if (foundAxeD) {
                    for (const indiceD of foundAxeD.indices) {
                        if (indiceD.nom === indice.nom) {
                            indiceD.set.push(indice.value);
                        }
                    }
                } else {
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
            try {
                await departement.save();
            } catch(e) {
                console.log("save departement failed when save city");
                const oldDepartement = await Departement.findOne({codeDepartement: departement.codeDepartement})
                console.log("old departement =>")
                console.log(JSON.stringify(oldDepartement,null,"\t"));
                console.log("new departement =>");
                console.log(JSON.stringify(departement,null,"\t"));
                throw e;
            }
        }
    }
    try {
        await city.save();
    } catch(e) {
        console.log("save failed");
        const oldCity = await City.findOne({codeCommune: city.codeCommune})
        console.log("old city =>")
        console.log(JSON.stringify(oldCity,null,"\t"));
        console.log("new city =>");
        console.log(JSON.stringify(city,null,"\t"));
        throw e;
    }
}

async function generateDatabase() {
    await City.deleteMany({});
    await Departement.deleteMany({});
    console.log("database purged");

    const computingPromises = [];

    const path = __dirname+"/docs/";
    for (const [dir,files] of Object.entries(indicesConfig.foldersAndFiles)) {
        const indices = {};

        const colNamesConfig = indicesConfig.colsNameByFolder[dir] ?? indicesConfig.colsNameByFolder.default;

        let cols = [colNamesConfig.codeCommune, colNamesConfig.nameCommune, 'Département'];
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

                        const obj = {codeCommune: line[indexByColName[colNamesConfig.codeCommune]]};
                        //console.log("find =>");
                        //console.log(obj);
                        city = await City.findOne(obj);
                        if (city === null) {
                            const obj = {
                                nom: line[indexByColName[colNamesConfig.nameCommune]],
                                codeCommune: line[indexByColName[colNamesConfig.codeCommune]],
                                codeDepartement: line[indexByColName['Département']]??null,
                                axes: []
                            };
                            try {
                                //console.log("create city "+obj.nom+" ("+obj.codeCommune+")");
                                //console.log(obj);
                                city = await City.create(obj);
                                //console.log("created")
                            } catch (e) {
                                console.log({file});
                                console.log("create failed");
                                console.log(obj);
                                console.log("cols =>");
                                console.log(cols);
                                console.log({i})
                                console.log("line =>");
                                console.log(line);
                                console.log({data});
                                console.log(indexByColName);
                                throw e;
                            }
                        }

                        if (departement === null || city.codeDepartement !== departement.codeDepartement) {
                            if (departement !== null) {
                                await saveDepartement(departement,indices);
                            }
                            departement = await Departement.findOne({codeDepartement: city.codeDepartement});
                            if (departement === null) {
                                const obj = {
                                    codeDepartement: city.codeDepartement,
                                    axes: []
                                };
                                try {
                                    //console.log("create city "+obj.nom+" ("+obj.codeCommune+")");
                                    //console.log(obj);
                                    departement = await Departement.create(obj);
                                    //console.log("created")
                                } catch (e) {
                                    console.log({file});
                                    console.log("create departement failed");
                                    console.log(obj);
                                    console.log("cols =>");
                                    console.log(cols);
                                    console.log({i})
                                    console.log("line =>");
                                    console.log(line);
                                    console.log({data});
                                    console.log(indexByColName);
                                    throw e;
                                }
                            }
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
                                try {
                                    await city.save();
                                } catch(e) {
                                    console.log("save failed 3");
                                    const oldCity = await City.findOne({codeCommune: city.codeCommune})
                                    console.log("old city =>")
                                    console.log(JSON.stringify(oldCity,null,"\t"));
                                    console.log("new city =>");
                                    console.log(JSON.stringify(city,null,"\t"));
                                    throw e;
                                }
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
                                    set: []
                                });
                                indicesByNameAndAxeName[axe.name][indice.name] = axe.indices[axe.indices.length - 1];
                            }
                        }
                        indicesByNameAndAxeName[axe.name][indice.name].set.push(indice.cols.reduce((acc,col) => {
                            const n = parseFloat(line[indexByColName[col]]);
                            return acc+(isNaN(n) ? 0 : n);
                        } , 0));
                    }
                    i ++;
                }

                const onClose = async () => {
                    console.log("finished "+file);
                    if (city) {
                        await saveCity(city,departement,indices);
                    }
                    if (departement) {
                        await saveDepartement(departement, indices);
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

    await Promise.all(computingPromises);
    console.log("FINISH");
}

module.exports = generateDatabase;