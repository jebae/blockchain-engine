const db = require("mongoose");
const models = require("../models");
const mine = require("../core/mine").mine;

db.connect(models.DB_ADDRESS);
mine();
