const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const db = require("mongoose");
const models = require("./models");
const ENV = process.env;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
db.connect(models.DB_ADDRESS);

const port = ENV.PORT || 8080;
const router = require("./routes")(app);

const server = app.listen(port, function() {
	console.log("Server running on " + port);
});
