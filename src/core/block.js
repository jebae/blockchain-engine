const Block = require("../models").Block;
const Transaction = require("../models").Transaction;
const Crypto = require("crypto");
const utils = require("../utils");

function createGenesisBlock() {
	var genesis, prevBlockHash, nonce=0;

	return Block.findOne().exec()
		.then(function(doc) {
			if (!doc) {	
				prevBlockHash = Crypto.createHash("sha256").update("genesis").digest("hex");
				while (1) {
					genesis = new Block({
						prevBlockHash,
						merkleRootHash: Crypto.createHash("sha256").update("merkleRootHash").digest("hex"),
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
		.catch(function(err) {
			throw err;
		});
}

function utxo(client) {
	return Block.aggregate([
		{ $unwind: "$txs" }, 
		{ $replaceRoot: { newRoot: "$txs" }},
		{ $match: { "outputs.receiver": client }},
		{ $lookup: { 
			from: "blocks", 
			let: { id: "$id", sender: "$sender" },
			pipeline: [
				{ $unwind: "$txs" },
				{ $project: {
					_id: 0,
					sender: "$txs.sender",
					inputs: "$txs.inputs"
				} },
				{ $unwind: "$inputs" },        
				{ $match: { $expr: { 
					$and: [
						{ $eq: [ "$inputs.id", "$$id" ]},
						{ $eq: [ "$sender", client ]}
					]                    
				}}}
			],
			as: "spent" 
		}},
		{ $project: {
			_id: 0,
			id: 1,
			sender: 1,
			inputs: 1,
			outputs: 1,
			timestamp: 1,
			spent: { $cond: {
				if: { $eq: [ "$spent", [] ] },
				then: false,
				else: true
			}}
		}},
		{ $match: { spent: false }},
		{ $sort: { timestamp: 1 }}
	]);
}

function chain() {
	return Block.find({}, { _id: 0, __v: 0 })
		.sort({ timestamp: 1 }).exec();
}

function isValidChain(chain) {
	var index = 1;
	var prevBlock = chain[0];

	if (!prevBlock) {
		return false;
	}
	
	while (index < chain.length) {
		if (!(
			Block.PoW(prevBlock) == chain[index].prevBlockHash &&
			Block.isValidProof(chain[index])
		)) {
			return false;
		}
		prevBlock = chain[index];
		index++;
	}
	return true;
}

function resolveConflict() {
	const url = "/chain";
	var newChain;
	var flag = false;

	return chain()
		.then(function(docs) {
			newChain = docs;

			return utils.reqToNodes(
				"GET", url, {}, 
				function(res) { return res.data }
			);
		})
		.then(function(responses) {
			for (var res of responses) {
				if (res.success && isValidChain(res.chain)) {
					if (
						(res.chain.length > newChain.length ) ||
						(res.chain.length == newChain.length && res.chain.length &&
						res.chain[res.chain.length-1].timestamp < newChain[newChain.length-1].timestamp)
					) {
						newChain = res.chain;
						flag = true;
					}
				}
			}
			if (flag) {
				return Block.remove({});
			}
		})
		.then(function(removed) {
			if (removed) {
				return Transaction.remove({});
			}
		})
		.then(function(removed) {
			if (removed) {
				return Block.insertMany(newChain);
			}
		})
		.catch(function(err) {
			throw err;
		});
}

module.exports = {
	createGenesisBlock,
	utxo,
	chain,
	isValidChain,
	resolveConflict
}
