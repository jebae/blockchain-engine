const block = require("../core").block;
const Transaction = require("../models").Transaction;

function createGenesisBlock(req, res) {
	block.createGenesisBlock()
		.then(function(block) {
			console.log("Genesis Block is created");
			res.json({ success: true });
		})
		.catch(function (err) {
			res.json({
				success: false,
				message: err.message
			});
			throw err;
		});
}

function create(req, res) {
	// no validation implemented
	const required = [ "txs", "timestamp", "nonce" ];

	for (var attr of required) {
		if (!req.body[attr]) {
			res.json({
				success: false,
				message: "NOT ENOUGH DATA"
			});
			return;
		}
	}
	
	block.create({
		txs: req.body.txs,
		timestamp: req.body.timestamp,
		nonce: req.body.nonce
	})
	.then(function() {
		return Transaction.remove({});
	})
	.then(function() {
		res.json({ success: true });
	})
	.catch(function (err) {
		res.json({
			success: false,
			message: err.message
		});
		throw err;
	});
}

module.exports = {
	create: create,
	createGenesisBlock: createGenesisBlock
}
