const BlockCore = require("../core").BlockCore;
const Transaction = require("../models").Transaction;

function utxo(req, res) {
	return BlockCore.utxo(req.params.client)
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
