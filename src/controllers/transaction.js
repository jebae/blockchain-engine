const transaction = require("../core").transaction;

function create(req, res) {
	// no validation implemented
	const required = [ "sender", "receiver", "amount" ];

	for (var attr of required) {
		if (!req.body[attr]) {
			res.json({
				success: false,
				message: "NOT ENOUGH DATA"
			});
			return;
		}
	}

	transaction.create({
		sender: req.body.sender,
		receiver: req.body.receiver,
		amount: req.body.amount
	})
	.then(function() {
		res.json({ success: true });
	})
	.catch(function(err) {
		res.json({
			success: false,
			message: "DATABASE ERROR"
		})
		throw err;
	});
}

module.exports = {
	create: create
}
