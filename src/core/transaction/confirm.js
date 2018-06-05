const Transaction = require("../../models").Transaction;
const utils = require("../../utils");

function confirm(tx) {
	var new_tx = new Transaction(tx);
	return new_tx.save();
}

function broadcastConfirm(tx) {
	const url = "/transaction/confirm";
	var consensus = 0,
		result = false;

	return utils.reqToNodes(
		url, tx.toObject(), 
		function(res) { return res.data }
	);
}

module.exports = {
	confirm,
	broadcastConfirm
}
