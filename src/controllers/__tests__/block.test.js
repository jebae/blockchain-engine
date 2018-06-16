const expect = require("chai").expect;
const sinon = require("sinon");
const setup = require("../../tests/setup");
const BlockController = require("../block");
const Block = require("../../models").Block;

describe("Block controller", function() {
	var sandbox, fakeIsValidProof, 
		prevBlock, client,
		res = {
			json: function(body) {
				this.body = body
			},
			body: {}
		}

	beforeEach(async function() {
		await setup.setup_db();

		sandbox = sinon.createSandbox();
		fakeIsValidProof = sandbox.stub(Block, "isValidProof");

		client = "Alice";
		var txs = [
			{
				id: "a",
				sender: "miner",
				inputs: [
					{ id: "b", amount: 10 }
				],
				outputs: [
					{ receiver: client, amount: 10 }
				],
				timestamp: Date.now() 
			},
			{
				id: "c",
				sender: "Shrek",
				inputs: [
					{ id: "d", amount: 5 }
				],
				outputs: [
					{ receiver: client, amount: 5 }
				],
				timestamp: Date.now() 
			},
			{
				id: "e",
				sender: "Jimmy",
				inputs: [
					{ id: "f", amount: 7 }
				],
				outputs: [
					{ receiver: client, amount: 7 }
				],
				timestamp: Date.now() 
			},
			{
				id: "g",
				sender: client,
				inputs: [
					{ id: "c", amount: 5 },
					{ id: "e", amount: 7 }
				],
				outputs: [
					{ receiver: "Shrek", amount: 8 },
					{ receiver: client, amount: 4 }
				],
				timestamp: Date.now() 
			}
		]
		prevBlock = new Block({
			prevBlockHash: "000002d5e6c91021440e41a7624e4733807dfd3e06ad15765a6f359f3c6041fa",
			merkleRootHash: " ",
			txs, 
			timestamp : 1527676984063,
			nonce : 168929
		});
	});

	it("should show utxo", async function() {
		await prevBlock.save();

		var req = { body: {
			client
		}};

		return BlockController.utxo(req, res)
			.then(function() {
				expect(res.body.success).to.equal(true);
				expect(res.body.utxo.length).to.not.equal(0);
			})
	});

	it("should show chain", async function() {
		var req = { body: { }};
		var block = new Block({
			prevBlockHash: "0000e93abd8969c91092045dbed5a8af912714d751faa6d19a0c379c86992171",
			merkleRootHash: " ",
			timestamp: 1527677193761,
			nonce: 1501
		});
		await prevBlock.save();
		await block.save();

		return Promise.resolve(BlockController.chain(req, res))
			.then(function() {
				expect(res.body.success).to.equal(true);
				var chain = res.body.chain;
				var prev = chain[0];

				for (var i=1; i < chain.length; i++) {
					expect(prev.timestamp < chain[i].timestamp).to.equal(true);
				}
			})
	});

	afterEach(async function() {
		sandbox.restore();
		await setup.reset_db();
	});
})
