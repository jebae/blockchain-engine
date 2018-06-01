const Crypto = require("crypto");
const expect = require("chai").expect;
const sinon = require("sinon");
const setup = require("../../tests/setup");
const BlockCore = require("../block");
const Block = require("../../models").Block;

describe("Block core", function() {
	var sandbox, fakeIsValidProof;
	var genesisPrevBlockHash = Crypto.createHash("sha256").update("genesis").digest("hex"),
		prevBlock;

	beforeEach(async function() {
		await setup.setup_db();

		sandbox = sinon.createSandbox();
		fakeIsValidProof = sandbox.stub(Block, "isValidProof");
		prevBlock = new Block({
			prevBlockHash: "000002d5e6c91021440e41a7624e4733807dfd3e06ad15765a6f359f3c6041fa",
			merkleRootHash: " ",
			txs : [ ],
			timestamp : 1527676984063,
			nonce : 168929
		});
	});

	it("should create genesis block", async function() {
		fakeIsValidProof.returns(true);
		return Promise.resolve(BlockCore.createGenesisBlock())
			.then(function(doc) {
				expect(doc.prevBlockHash).to.equal(genesisPrevBlockHash);
				return Block.find();
			})
			.then(function(blocks) {
				expect(blocks.length).to.equal(1);
			});
	});

	it("should not create genesis block when last block exists", async function() {
		fakeIsValidProof.returns(true);
		var block = new Block({
			prevBlockHash: "0000e93abd8969c91092045dbed5a8af912714d751faa6d19a0c379c86992171",
			merkleRootHash: " ",
			timestamp: 1527677193761,
			nonce: 1501
		});
		await block.save();

		return Promise.resolve(BlockCore.createGenesisBlock())
			.catch(function(err) {
				expect(err.message).to.equal("GENESIS BLOCK IS ALREADY EXIST");
				return Block.find();
			})
			.then(function(blocks) {
				expect(blocks.length).to.equal(1);
			});
	});

	afterEach(async function() {
		sandbox.restore();
		await setup.reset_db();
	});
})
