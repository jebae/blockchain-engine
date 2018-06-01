const Block = require("../models").Block;
const Transaction = require("../models").Transaction;
const Crypto = require("crypto");

function create(tx) {
	var new_tx = new Transaction({
		sender: tx.sender,
		receiver: tx.receiver,
		amount: tx.amount
	});
	new_tx.makeId();
	
	return new_tx.save();
}

module.exports = {
	create: create
}
