const db = require("mongoose");
const models = require("../models");
const Block = require("../models").Block;
const Transaction = require("../models").Transaction;
const Crypto = require("crypto");

function createGenesisBlock() {
	db.connect(models.DB_ADDRESS);
	var genesis, prevBlockHash, nonce=0;

	return Block.findOne().exec()
		.then(function(doc) {
			if (!doc) {	
				prevBlockHash = Crypto.createHash("sha256").update("genesis").digest("hex");
				while (1) {
					genesis = new Block({
						prevBlockHash,
						merkleRootHash: " ",
						txs: [],
						nonce,
						timestamp: Date.now()
					});
					if (Block.isValidProof(genesis)) break;
					nonce++;
				}
				genesis.save();
			} else {
				throw new Error("GENESIS BLOCK IS ALREADY EXIST");
			}
		})
		.catch(function(err) {
			throw err;
		});
}

module.exports = {
	createGenesisBlock
}
