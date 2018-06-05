const tx = require("./controllers").TxController;
const block = require("./controllers").blockController;

module.exports = function (app) {
	app.post("/transaction/create", tx.create);
	app.post("/transaction/validate", tx.validate);
	app.post("/transaction/confirm", tx.confirm);
}
