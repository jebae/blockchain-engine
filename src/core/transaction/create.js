const Transaction = require("../../models").Transaction;
const Validate = require("./validate");
const Confirm = require("./confirm");

function create(tx, sign) {
	var new_tx = new Transaction({
		sender: tx.sender,
		inputs: tx.inputs,
		outputs: tx.outputs
	});
	new_tx.makeId();
	
	return new_tx.save();
}

function createWithConsensus(tx, sign) {
	return Validate.gatherValidate(tx, sign)
		.then(function (validates) {
			if (validates.result) {
				return create(tx, sign)
					.then(function(tx) {
						return Confirm.broadcastConfirm(tx);
					})
					.then(function() {
						return validates;
					})
					.catch(function(err) {
						throw err;
					});
			}
			return validates;
		});
}

module.exports = {
	create,
	createWithConsensus
}
