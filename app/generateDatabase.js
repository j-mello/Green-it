const fs = require("fs");

async function generateDatabase() {
    const filename = __dirname+"/docs/Population 2016/base-ic-evol-struct-pop-2016.csv";
    const stream = await fs.createReadStream(filename, {encoding: 'utf8'});
    stream.on('data', data => {
        console.log(data.split(','));
    })
}

module.exports = generateDatabase;