const Crypto = require("crypto");
const db = require("mongoose");
const axios = require("axios");
const ENV = process.env;
const models = require("../models");
const Block = require("../models").Block;
const Transaction = require("../models").Transaction;

async function mine() {
	db.connect(models.DB_ADDRESS);

	var block,
		prevBlockHash,
		nonce = 0;

	async function check(n) {
		return await Block.lastBlock()
			.then(function(last_block) {
				prevBlockHash = Block.PoW(last_block);
				return Transaction.find().select({ _id: 0 }).exec();
			})
			.then(function(txs) {
				block = new Block({
					prevBlockHash,
					merkleRootHash: " ",
					txs,
					timestamp: Date.now(),
					nonce: n
				});

				if (Block.isValidProof(block)) {
					console.log("getit");
					return true;
				}
				return false;
			})
			.catch(function(err) {
				throw err;
			})
	}

	var time = Date.now();

	while (1) {
		console.log(nonce);
		var c = await check(nonce++);
		console.log("\n");
		if (c) {
			console.log(
				"prevBlockHash: ", block.prevBlockHash,
				"txs: ", block.txs,
				"timestamp: ", block.timestamp,
				"nonce: ", block.nonce
			);
			console.log("Time : " + (Date.now() - time) / 1000);
			await axios.post("http://localhost:" + ENV.PORT + "/block/create", {
				txs: block.txs,
				timestamp: block.timestamp,
				nonce: block.nonce
			})
			.then(function(res) {
				console.log(res.data);
			})
			.catch(function (err) {
				throw err;
			})
			break;
		}
	}
}

module.exports = {
	mine: mine
}
