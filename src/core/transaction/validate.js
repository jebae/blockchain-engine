const Crypto = require("crypto");
const EC = require("elliptic").ec;
const utils = require("../../utils");
const WRONG_SIGN = "Sign is wrong";
const WRONG_AMOUNT = "Amount is wrong";

function amountValidate(tx) {
	var inputsAmount = tx.inputs.reduce(function(acc, i) {
		return acc + i.amount;
	}, 0);

	var outputsAmount = tx.outputs.reduce(function(acc, o) {
		return acc + o.amount;
	}, 0);

	if ((!inputsAmount) || (!outputsAmount) || (inputsAmount != outputsAmount)) {
		return WRONG_AMOUNT;
	}
	return null;
}

function signValidate(tx, sign) {
	try {
		const ec = EC("secp256k1");
		const pubkey = tx.sender;

		// sender, inputs, outputs only contained in tx
		msg = Crypto.createHash("sha256").update(
			JSON.stringify(tx)
		).digest("hex");
		var verifier = ec.keyFromPublic(pubkey, "hex").verify(msg, sign);

		if (verifier) {
			return null;
		}
		return WRONG_SIGN;
	} catch (err) {
		return WRONG_SIGN;
	}
}

function validate(tx, sign) {
	for (var func of [ amountValidate, signValidate ]) {
		var message = func(tx, sign);
		if (message) {
			return message;
		}
	}
	return null;
}

function gatherValidate(tx, sign) {
	const url = "/transaction/validate";
		data = { transaction: tx, sign };
	var consensus = 0,
		result = false;

	message = validate(tx, sign);
	if (!message) consensus++;
	
	return utils.reqToNodes(
		url, data, 
		function(res) { return res.data }
	)
	.then(function (responses) {
		for (var res of responses) {
			if (res.success && res.validate) consensus++;
		}
		result = ((responses.length + 1) / 2 < consensus) ? true : false;

		return {
			result,
			consensus,
			responses
		}
	})
}

module.exports = {
	amountValidate,
	signValidate,
	validate,
	gatherValidate,
	WRONG_AMOUNT,
	WRONG_SIGN
}
