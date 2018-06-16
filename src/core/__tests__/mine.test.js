const expect = require("chai").expect;
const sinon = require("sinon");
const setup = require("../../tests/setup");
const MineCore = require("../mine");
const Block = require("../../models").Block;
const Transaction = require("../../models").Transaction;
const utils = require("../../utils");

describe("Mine core", function() {
	var sandbox, fakeIsValidProof, fakeReqToNodes,
		genesis, tx;

	beforeEach(async function() {
		await setup.setup_db();
		sandbox = sinon.createSandbox();
		fakeIsValidProof = sandbox.stub(Block, "isValidProof");
		fakeReqToNodes = sandbox.stub(utils, "reqToNodes");

		genesis = new Block({
			prevBlockHash: "0000e93abd8969c91092045dbed5a8af912714d751faa6d19a0c379c86992171",
			merkleRootHash: " ",
			txs: [],
			timestamp: 1527677193761,
			nonce: 1501
		});
		tx = {
			sender: "0451347798bb9704b3a59d00098312e647456a0d7d0aa7f8b6" +
				"9822df6f5f70526a76208346f8881ffd5682c71badf9ee59a3d0ffd60712a9b7636dd076690c6bbb",
			inputs: [
				{ id: "id1", amount: 5 }
			],
			outputs: [
				{ receiver: "receiver", amount: 5 }
			]
		};
	});

	it("should not mine without genesis block", async function() {
		fakeReqToNodes.returns(Promise.all([
			Promise.resolve({
				success: true,
				chain: [ ]
			}),
		]));

		return Promise.resolve(MineCore.mine())
			.catch(function(err) {
				expect(err.message).to.equal("Genesis block is not exist");
			});
	});

	it("should mine", async function() {
		fakeIsValidProof.returns(true);
		fakeReqToNodes.returns(Promise.all([
			Promise.resolve({
				success: true,
				chain: [ ]
			}),
		]));
		var new_tx = new Transaction(tx);
		new_tx.makeId();
		await new_tx.save();
		await genesis.save();
		
		return Promise.resolve(MineCore.mine(true))
			.then(function(block) {
				expect(block.txs[0].inputs.length).to.equal(0);
				expect(block.txs[1].inputs.length).to.equal(tx.inputs.length);
				return Transaction.find();
			})
			.then(function(txs) {
				expect(txs.length).to.equal(0);
			});
	});

	afterEach(async function() {
		sandbox.restore();
		await setup.reset_db();
	});
});
