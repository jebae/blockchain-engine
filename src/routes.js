const TxController = require("./controllers").TxController;
const BlockController = require("./controllers").BlockController;

module.exports = function (app) {
	app.post("/transaction/create", TxController.create);
	app.post("/transaction/validate", TxController.validate);
	app.post("/transaction/confirm", TxController.confirm);
	app.get("/utxo/:client", BlockController.utxo);
	app.get("/chain", BlockController.chain);
}
