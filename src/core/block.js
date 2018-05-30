const Block = require("../models").Block;
const Transaction = require("../models").Transaction;
const Crypto = require("crypto");

function createGenesisBlock() {
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
				return genesis.save();
			} else {
				throw new Error("GENESIS BLOCK IS ALREADY EXIST");
			}
		})
}

function create(block) {
	var new_block;

	return Block.lastBlock()
		.then(function (last_block) {
			var prevBlockHash = Block.PoW(last_block);

			// must handle merkleRootHash

			new_block = new Block({
				prevBlockHash,
				merkleRootHash: " ",
				txs: block.txs,
				timestamp: block.timestamp,
				nonce: block.nonce
			});
		})
		.then(function () {
			if (Block.isValidProof(new_block)) {
				return new_block.save();
			}
			throw new Error("PROOF NOT MATCH");
		});
}

module.exports = {
	create: create,
	createGenesisBlock: createGenesisBlock
}
