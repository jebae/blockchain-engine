const tx = require("./controllers").txController;
const block = require("./controllers").blockController;

module.exports = function (app) {
	app.post("/transaction/create", tx.create);
}
