const db = require("mongoose");
const axios = require("axios");
const ENV = process.env;
const models = require("../models");
const Block = require("../models").Block;
const Transaction = require("../models").Transaction;

function check(nonce) {
	return Block.lastBlock()
		.then(function(last_block) {
			if (!last_block)
				throw new Error("Genesis block is not exist");

			prevBlockHash = Block.PoW(last_block);
			return Transaction.find().select({ _id: 0 }).exec();
		})
		.then(function(txs) {
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

function mine() {
	var nonce = 0;

	var loop = function() {
		return check(nonce++)
			.then(function(block) {
				if (block) {
					block.save()
						.then(function() {
							return Transaction.remove({});
						})
						.then(function() {
							console.log("\n====================== MINE ======================\n")
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
