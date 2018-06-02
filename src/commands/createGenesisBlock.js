const db = require("mongoose");
const models = require("../models");
const createGenesisBlock = require("../core/block").createGenesisBlock;

db.connect(models.DB_ADDRESS);
createGenesisBlock();
