const fs = require("fs");
const fsPromise = require("fs/promises");
const indicesConfig = require("./indicesConfig");
const City = require("./Models/City");

const createCityGetter = async (callback) => {
    const value = await callback();
    return (callback) => {
        callback(value);
    }
}

async function generateDatabase() {
    await City.deleteMany({});

    const computingPromises = [];
    const globalCityGetPromises = {};

    const path = __dirname+"/docs/";
    for (const dir of await fsPromise.readdir(path)) {
        const indices = [];

        const colNamesConfig = indicesConfig.colsNameByFolder[dir] ?? indicesConfig.colsNameByFolder.default;

        let cols = [colNamesConfig.numCommune, colNamesConfig.nameCommune, 'Département'];
        for (const axe of indicesConfig.axes) {
            for (const indice of axe.indices) {
                if (indice.docFolder === dir) {
                    indices.push({
                        ...indice,
                        axeName: axe.name
                    });
                    cols = [...cols, ...indice.cols];
                }
            }
        }

        for (const file of await fsPromise.readdir(path+dir)) {
            computingPromises.push((() => new Promise(resolve => {
                console.log("read "+file);
                const stream = fs.createReadStream(path+dir+"/"+file, {encoding: 'utf8'});
                let city = null;
                let axesByName = {};
                let indicesByNameAndAxeName = {};

                const indexByColName = {};
                let i = 0;

                stream.on('end', async () => {
                    console.log("finished "+file);
                    if (city) {
                        try {
                            await city.save();
                        } catch(e) {
                            console.log("save failed");
                            console.log(city);
                            throw e;
                        }
                    }
                    resolve();
                })

                const eachLine = async data => {
                    if (i === 0) {
                        for (const [i,colname] of Object.entries(data.split(","))) {
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

                    const line = data.split(",");
                    if (city === null || city.codeCommune !== line[indexByColName[colNamesConfig.numCommune]]) {
                        if (city !== null) {
                            try {
                                await city.save();
                            } catch(e) {
                                console.log("save failed 2");
                                console.log(city);
                                throw e;
                            }
                        }
                        axesByName = {};
                        indicesByNameAndAxeName = {};
                        if (globalCityGetPromises[line[indexByColName[colNamesConfig.numCommune]]] === undefined) {
                            globalCityGetPromises[line[indexByColName[colNamesConfig.numCommune]]] = createCityGetter(() => City.findOne({codeCommune: line[indexByColName[colNamesConfig.numCommune]]}));
                        }
                        city = await (() => new Promise(resolve => {
                            globalCityGetPromises[line[indexByColName[colNamesConfig.numCommune]]](resolve)
                        }));
                        delete globalCityGetPromises[line[indexByColName[colNamesConfig.numCommune]]];

                        if (city === null) {
                            const obj = {
                                nom: line[indexByColName[colNamesConfig.nameCommune]],
                                codeCommune: line[indexByColName[colNamesConfig.numCommune]],
                                codeDepartement: line[indexByColName['Département']],
                                axes: []
                            };
                            try {
                                console.log("create city "+obj.nom+" ("+obj.codeCommune+")");
                                globalCityGetPromises[obj.codeCommune] = createCityGetter(() => City.create(obj));
                                city = await (() => new Promise(resolve => {
                                    globalCityGetPromises[line[indexByColName[colNamesConfig.numCommune]]](resolve)
                                }));
                                delete globalCityGetPromises[obj.codeCommune];
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
                    }

                    for (const indice of indices) {
                        if (axesByName[indice.axeName] === undefined) {
                            city.axes.push({
                                name: indice.axeName,
                                indices: []
                            });
                            axesByName[indice.axeName] = city.axes[city.axes.length-1];
                        }
                        const axe = axesByName[indice.axeName];
                        if (indicesByNameAndAxeName[axe.name] === undefined) {
                            indicesByNameAndAxeName[axe.name] = {};
                        }
                        if (indicesByNameAndAxeName[axe.name][indice.name] === undefined) {
                            axe.indices.push({
                                name: indice.name,
                                value: 0
                            });
                            indicesByNameAndAxeName[axe.name][indice.name] = axe.indices[axe.indices.length-1];
                        }
                        for (const col of indice.cols) {
                            indicesByNameAndAxeName[axe.name][indice.name].value += parseInt(line[indexByColName[col]]);
                        }
                    }
                    i ++;
                }

                let currentLines = "";
                stream.on('data', async data => {
                    currentLines += data;
                    let lines;
                    if ((lines = currentLines.split("\n")).length > 1) {
                        currentLines = lines[lines.length-1];
                        lines = lines.slice(0,-1);
                        for (const line of lines) {
                            eachLine(line)
                        }
                    }
                });
            }))());
        }
    }

    await Promise.all(computingPromises);
    console.log("FINISH");
}

module.exports = generateDatabase;