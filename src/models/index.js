const db = require("mongoose");
const ENV = process.env;
const Crypto = require("crypto");

const TransactionSchema = new db.Schema({
	id: { type: String, required: true },
	sender: { type: String, required: true },
	receiver: { type: String, required: true },
	amount: { type: Number, required: true },
	timestamp: { type: Number, default: Date.now }
});

TransactionSchema.methods.makeId = function() {
	this.id = Crypto.createHash("sha256").update(
		this.sender +
		this.receiver +
		this.amount +
		this.timestamp
	).digest("hex");
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

	console.log("nonce", block.nonce, "hash", hash);
	if (hash.split("00")[0] === "") 
		return true;
	return false;
}

const Transaction = db.model("transactions", TransactionSchema);
const Block = db.model("blocks", BlockSchema);

module.exports = {
	DB_ADDRESS: "mongodb://" + ENV.DB_HOST + "/" + ENV.DB_NAME,
	Transaction: Transaction,
	Block: Block
};
