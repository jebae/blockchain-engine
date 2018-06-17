const Crypto = require("crypto");
const EC = require("elliptic").ec;
const utils = require("../../utils");
const BlockCore = require("../block");
const WRONG_SIGN = "Sign is wrong";
const WRONG_AMOUNT = "Amount is wrong";
const WRONG_INPUTS = "Input is wrong";

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
		msg = Crypto.createHash("sha1").update(
			tx.sender +
			tx.timestamp
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

function inputsValidate(tx) {
	return BlockCore.utxo(tx.sender)
		.then(function(utxo) {
			for (var input of tx.inputs) {
				var inutxo = utxo.filter(function(t) {
					return (
						t.id == input.id &&
						t.outputs.filter(function(output) {
							return (
								output.receiver == tx.sender &&
								output.amount == input.amount
							);
						}).length
					);
				}).length;

				if (inutxo) {
					continue;
				}
				return WRONG_INPUTS;
			}
			return null;
		});

}

function validate(tx, sign) {
	for (var func of [ amountValidate, signValidate ]) {
		var message = func(tx, sign);
		if (message) {
			return Promise.resolve(message);
		}
	}

	return inputsValidate(tx)
		.then(function(message) {
			return message;
		});
}

function gatherValidate(tx, sign) {
	const url = "/transaction/validate",
		data = { transaction: tx, sign };
	var consensus = 0,
		result = false;

	return validate(tx, sign)
		.then(function(message) {
			if (!message) consensus++;

			return utils.reqToNodes(
				"POST", url, data, 
				function(res) { return res.data }
			);
		})
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
	inputsValidate,
	validate,
	gatherValidate,
	WRONG_AMOUNT,
	WRONG_SIGN
}
