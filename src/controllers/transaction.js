const Create = require("../core").TxCore.create;
const Validate = require("../core").TxCore.validate;
const Confirm = require("../core").TxCore.confirm;
const validateRequestBody = require("../utils").validateRequestBody;
const NEW_TX_CREATED = "New transaction is created";
const TX_INVALID = "Transaction is invalid";

function create(req, res) {
	const required = { 
		transaction: [ "sender", "inputs", "outputs" ],
		sign: undefined
	};
	var message = validateRequestBody(req, required);

	if (message) {
		res.json({
			success: false,
			message
		});
		return;
	}

	
	return Create.createWithConsensus(req.body.transaction, req.body.sign)
		.then(function(validates) {
			res.json(
				Object.assign({
					success: true,
					message: (validates.result) ? NEW_TX_CREATED : TX_INVALID,
				}, validates)
			);
		})
		.catch(function(err) {
			res.json({
				success: false,
				message: err.message
			})
			throw err;
		});
}

function validate(req, res) {
	const nodeNum = process.env["NODE_NUM"];
	const required = { 
		transaction: [ "sender", "inputs", "outputs" ],
		sign: undefined
	};

	var message = validateRequestBody(req, required);
	if (message) {
		res.json({
			success: false,
			message
		});
		return;
	}

	message = Validate.validate(req.body.transaction, req.body.sign);
	if (message) {
		res.json({
			success: true,
			validate: false,
			nodeNum,
			message
		});
		return;
	}

	res.json({
		success: true,
		validate: true,
		nodeNum
	});
}

function confirm(req, res) {
	return Confirm.confirm(req.body)
		.then(function(tx) {
			res.json({
				success: true,
				message: NEW_TX_CREATED
			});
		})
		.catch(function(err) {
			res.json({
				success: false,
				message: err.message
			});
			throw err;
		})
}

module.exports = {
	create,
	validate,
	confirm
}
