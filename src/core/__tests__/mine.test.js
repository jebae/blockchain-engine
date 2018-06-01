const expect = require("chai").expect;
const setup = require("../../tests/setup");
const MineCore = require("../mine");
const Block = require("../../models").Block;

describe("Mine core", function() {
	var genesis;

	beforeEach(async function() {
		await setup.setup_db();
		genesis = new Block({
			prevBlockHash: "0000e93abd8969c91092045dbed5a8af912714d751faa6d19a0c379c86992171",
			merkleRootHash: " ",
			txs: [],
			timestamp: 1527677193761,
			nonce: 1501
		});
	});

	it("should not mine without genesis block", async function() {
		return Promise.resolve(MineCore.mine())
			.catch(function(err) {
				expect(err.message).to.equal("Genesis block is not exist");
			});
	});

	it.skip("should mine", async function() {
		await genesis.save();

		return Promise.resolve(MineCore.mine())
			.then(function(block) {
				console.log(block);
			});
	});

	afterEach(async function() {
		await setup.reset_db();
	});
});
