const expect = require("chai").expect;
const setup = require("../../tests/setup");
const Crypto = require("crypto");
const Transaction = require("../").Transaction;
const Block = require("../").Block;

describe("Block Model", function() {
	var test_block = {
		prevBlockHash: "0000e93abd8969c91092045dbed5a8af912714d751faa6d19a0c379c86992171",
		merkleRootHash: " ",
		timestamp: 1527677193761,
		nonce: 1501
	};

	beforeEach(async function() {
		await setup.setup_db();
	});

	it("should do PoW", function() {
		var block = new Block(test_block);
		block.txs = [];
		
		expect(Block.isValidProof(block)).to.equal(true);
	});

	it("should return merkleRootHash", function() {
		var block = new Block({
			txs: [
				{ id: Crypto.createHash("sha256").update(Math.random().toString()).digest("hex") },
				{ id: Crypto.createHash("sha256").update(Math.random().toString()).digest("hex") },
				{ id: Crypto.createHash("sha256").update(Math.random().toString()).digest("hex") },
				{ id: Crypto.createHash("sha256").update(Math.random().toString()).digest("hex") },
				{ id: Crypto.createHash("sha256").update(Math.random().toString()).digest("hex") }
			]
		});
		var txs = block.txs.sort(function(a, b) {
			return a.id > b.id;
		}).map(function(tx) {
			return tx.id;
		});
		txs = [
			Crypto.createHash("sha256").update(txs[0] + txs[1]).digest("hex"),
			Crypto.createHash("sha256").update(txs[2] + txs[3]).digest("hex"),
			Crypto.createHash("sha256").update(txs[4] + txs[4]).digest("hex")
		];

		txs = [
			Crypto.createHash("sha256").update(txs[0] + txs[1]).digest("hex"),
			Crypto.createHash("sha256").update(txs[2] + txs[2]).digest("hex")
		];

		var expectedMerkleRootHash = Crypto.createHash("sha256").update(txs[0] + txs[1]).digest("hex");
		expect(expectedMerkleRootHash).to.equal(Block.merkleRootHash(block));
	})

	afterEach(async function() {
		await setup.reset_db();
	});
});
