const Block = require("../models").Block;
const Transaction = require("../models").Transaction;
const Crypto = require("crypto");

function create(tx) {
	var new_tx = new Transaction({
		sender: tx.sender,
		receiver: tx.receiver,
		amount: tx.amount
	});
	
	new_tx.id = Crypto.createHash("sha256").update(
		new_tx.sender + new_tx.receiver + new_tx.amount + new_tx.timestamp
	).digest("hex");
	
	return new_tx.save();
}

module.exports = {
	create: create
}
