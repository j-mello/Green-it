const mongoose = require("mongoose");

const {MONGO_INITDB_USERNAME, MONGO_INITDB_PASSWORD, MONGO_HOST, MONGO_INITDB_DATABASE} = process.env;

let nbRetry = 0;
const nbRetryMax = 20;

let database;

const connect = () => {
    console.log("connect");

    if (nbRetry >= nbRetryMax) {
        console.log("Connexion impossible");
        return;
    } else if (nbRetry > 0) {
        console.log("Re try to connect")
    }

    if (database) return database;

    const url = 'mongodb://' + MONGO_INITDB_USERNAME + ':' + MONGO_INITDB_PASSWORD + '@' + MONGO_HOST + ':27017/' + MONGO_INITDB_DATABASE;

    mongoose.connect(url);

    database = mongoose;

    database.connection.once("open", () => {
        console.log("Connected to database");
    });

    database.connection.on("error", () => {
        console.log("Error connecting to database");
        database = undefined;
        nbRetry += 1;
        setTimeout(connect, 250);
    });

    return database;
};

const disconnect = () => {
    if (!database) return;
    mongoose.disconnect();
    return mongoose;
};

module.exports = {connect, disconnect};