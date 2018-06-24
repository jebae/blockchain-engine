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

	it.skip("should return merkleRootHash", function() {
		var block = new Block({
			txs: [
				{ sender: "a", timestamp: Date.now() },
				{ sender: "b", timestamp: Date.now() },
				{ sender: "c", timestamp: Date.now() },
				{ sender: "d", timestamp: Date.now() },
				{ sender: "e", timestamp: Date.now() }
			]
		});
		var txs = block.txs.map(function(v) {
			return Transaction.makeId(v);
		}).sort(function(a, b) {
			return a > b;
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
	});

	it("shoud pass test", function() {
		var txs = [
			{ timestamp: 1529826203223 },
			{ 
				sender: "0479ee1db27f68e780479d0a589861b55dee7ae1cd2081c1327c979378dd3d6ef91e698730852bbab049c7ab1406f160dae9601c30360ada06f26ab1c408cce40e", 
				timestamp: 1529826008969 
			}
		]
		const block = {
			txs
		}
		console.log(Block.merkleRootHash(block))
	})

	afterEach(async function() {
		await setup.reset_db();
	});
});
