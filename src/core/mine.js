const db = require("mongoose");
const axios = require("axios");
const ENV = process.env;
const Block = require("../models").Block;
const Transaction = require("../models").Transaction;

function check(nonce) {
	return Block.lastBlock()
		.then(function(last_block) {
			if (!last_block) {
				throw new Error("Genesis block is not exist");
			}

			prevBlockHash = Block.PoW(last_block);
			return Transaction.find().select({ _id: 0 });
		})
		.then(function(txs) {
			txs.unshift(Transaction.coinbase());
			block = new Block({
				prevBlockHash,
				merkleRootHash: " ",
				txs,
				timestamp: Date.now(),
				nonce
			});

			if (Block.isValidProof(block)) {
				return block;
			}
			return false;
		})
		.catch(function(err) {
			throw err;
		})
}

function mine(breakpoint) {
	var nonce = 0;

	var loop = function() {
		return check(nonce++)
			.then(function(block) {
				if (block) {
					return block.save()
						.then(function() {
							return Transaction.remove({});
						})
						.then(function() {
							nonce = 0;
							console.log("\n====================== MINE ======================\n")
						})
						.then(function() {
							if (breakpoint) {
								return block;
							}
							return loop();
						})
						.catch(function(err) {
							throw err;
						});
				}
				return loop();
			})
			.catch(function(err) {
				throw err;
			});
	}
	return loop();
}

module.exports = {
	mine: mine
}
