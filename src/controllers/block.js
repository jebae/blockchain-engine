const BlockCore = require("../core").BlockCore;
const Transaction = require("../models").Transaction;

function utxo(req, res) {
	return BlockCore.utxo(req.body.client)
		.then(function(_utxo) {
			res.json({
				success: true,
				utxo: _utxo
			});
		})
		.catch(function(err) {
			res.json({
				success: false
			})
			throw err;
		})
}

function chain(req, res) {
	console.log("chain is read");
	return BlockCore.chain()
		.then(function(chain) {
			res.json({
				success: true,
				chain
			});
		});
}

module.exports = {
	utxo,
	chain
}
