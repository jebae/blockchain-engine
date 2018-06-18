const db = require("mongoose");
const ENV = process.env;
const Crypto = require("crypto");
const MinerPubkey = ENV["MINER_PUBKEY"];
const COIN_BASE_AMOUNT = 25;

const TransactionSchema = new db.Schema({
	id: { type: String, required: true },
	sender: String,
	inputs: [
		{ id: String, amount: Number, _id: false }
	],
	outputs: [
		{ receiver: String, amount: Number, _id: false }
	],
	timestamp: { type: Number, default: Date.now }
});

if (!TransactionSchema.options.toObject) TransactionSchema.options.toObject = {};
TransactionSchema.options.toObject.transform = function(doc, ret, options) {
	delete ret._id;
	delete ret.__v;
	return ret;
}

TransactionSchema.methods.makeId = function() {
	var source = this.toObject();

	this.id = Crypto.createHash("sha256").update(
		source.sender || "" +
		source.timestamp.toString()
	).digest("hex");
}

TransactionSchema.statics.coinbase = function() {
	var coinbase = new Transaction({
		outputs: [
			{ receiver: MinerPubkey, amount: COIN_BASE_AMOUNT }
		]
	});
	coinbase.makeId();
	return coinbase;
}

const BlockSchema = new db.Schema({
	prevBlockHash: { type: String, required: true },
	merkleRootHash: { type: String, required: true },
	nonce: { type: Number, required: true },
	txs: [ TransactionSchema ],
	timestamp: { type: Number, required: true }
});

BlockSchema.statics.lastBlock = function() {
	return this.findOne().sort({ timestamp: -1 }).exec();
}

BlockSchema.statics.PoW = function(block) {
	return Crypto.createHash("sha256").update(
		block.prevBlockHash +
		block.merkleRootHash +
		block.timestamp +
		block.nonce
	).digest("hex");
}

BlockSchema.statics.isValidProof = function(block) {
	var hash = this.PoW(block);

	if (process.argv && process.argv[2] == "log")
		console.log("nonce", block.nonce, "hash", hash);
	if (hash.split("00")[0] === "") 
		return true;
	return false;
}

BlockSchema.statics.merkleRootHash = function(block) {
	var i, length;
	var txs = block.txs.sort(function(a, b) {
		return a.id > b.id;
	}).map(function(tx) {
		return tx.id;
	});

	while (txs.length != 1) {
		if (txs.length % 2) {
			txs.push(txs[txs.length - 1]);
		}
		length = txs.length;

		for (i=0; i < length; i+=2) {
			txs.push(
				Crypto.createHash("sha256").update(
					txs[0] + txs[1]
				).digest("hex")
			);
			txs.shift();
			txs.shift();
		}
	}
	return txs[0];
}

const NodeSchema = new db.Schema({
	host: { type: String, required: true },
	port: { type: Number, required: true }
});

NodeSchema.virtual("address").get(function() {
	return this.host + ":" + this.port;
})

const Transaction = db.model("transactions", TransactionSchema);
const Block = db.model("blocks", BlockSchema);
const Node = db.model("nodes", NodeSchema);

module.exports = {
	DB_ADDRESS: "mongodb://" + ENV.DB_HOST + "/" + ENV.DB_NAME,
	Transaction,
	Block,
	Node
};
