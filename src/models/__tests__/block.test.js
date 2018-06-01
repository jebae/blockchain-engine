const expect = require("chai").expect;
const setup = require("../../tests/setup");
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

	afterEach(async function() {
		await setup.reset_db();
	});
});
