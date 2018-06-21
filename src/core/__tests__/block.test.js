const Crypto = require("crypto");
const expect = require("chai").expect;
const sinon = require("sinon");
const setup = require("../../tests/setup");
const BlockCore = require("../block");
const Block = require("../../models").Block;
const utils = require("../../utils");

describe("Block core", function() {
	var sandbox, fakeIsValidProof, fakeReqToNodes;
	var genesisPrevBlockHash = Crypto.createHash("sha256").update("genesis").digest("hex"),
		prevBlock, txs, client;

	beforeEach(async function() {
		await setup.setup_db();

		sandbox = sinon.createSandbox();
		fakeIsValidProof = sandbox.stub(Block, "isValidProof");
		fakeReqToNodes = sandbox.stub(utils, "reqToNodes");

		client = "Alice";
		txs = [
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

	it("should return utxo", async function() {
		await prevBlock.save();

		var expected_utxo = txs.filter(function(obj) {
			return (
				obj.outputs.filter(function(output) {
					return output.receiver == client
				}).length > 0 
				&&
				txs.filter(function(tx) {
					return (
						tx.sender == client &&
						tx.inputs.filter(function(input) {
							return input.id == obj.id
						}).length > 0
					);
				}).length == 0
			);
		})
		
		return Promise.resolve(BlockCore.utxo(client))
			.then(function(utxo) {
				expect(
					utxo.map(function(obj) { return obj.id }).sort()
				).to.deep.equal(
					expected_utxo.map(function(obj) { return obj.id }).sort()
				);
			})
	});

	it("should return full blockchain", async function() {
		var block = new Block({
			prevBlockHash: "0000e93abd8969c91092045dbed5a8af912714d751faa6d19a0c379c86992171",
			merkleRootHash: " ",
			timestamp: 1527677193761,
			nonce: 1501
		});
		await block.save();
		await prevBlock.save();

		return Promise.resolve(BlockCore.chain())
			.then(function(chain) {
				var prev = chain[0];

				for (var i=1; i < chain.length; i++) {
					expect(prev.timestamp < chain[i].timestamp).to.equal(true);
				}
			})
	});

	it("should resolve conflict", async function() {
		var genesis = {
			prevBlockHash : Crypto.createHash("sha256").update("genesis").digest("hex"),
			merkleRootHash : " ",
			txs : [ ],
			nonce : 59,
			timestamp : 1529163471863,
		};
		var block1 = {
			prevBlockHash : Block.PoW(genesis),
			merkleRootHash : " ",
			txs : [ ],
			timestamp : 1529163702045,
			nonce : 133
		};
		var block2 = {
			prevBlockHash : Block.PoW(block1),
			merkleRootHash : " ",
			txs : [ ],
			timestamp : 1529163702938,
			nonce : 231
		};
		fakeIsValidProof.returns(true);
		fakeReqToNodes.returns(Promise.all([
			Promise.resolve({
				success: true,
				chain: [ genesis, block1, block2 ]
			}),
			Promise.resolve({
				success: true,
				chain: [ genesis ]
			})
		]));
		genesis = new Block(genesis);
		block1 = new Block(block1);
		await genesis.save();
		await block1.save();

		var beforeChain = await BlockCore.chain();

		return Promise.resolve(BlockCore.resolveConflict())
			.then(function() {
				return BlockCore.chain();
			})
			.then(function(afterChain) {
				expect(beforeChain.length < afterChain.length).to.equal(true);
			})
	})
	afterEach(async function() {
		sandbox.restore();
		await setup.reset_db();
	});
})
