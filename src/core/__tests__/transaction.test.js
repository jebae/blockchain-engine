const expect = require("chai").expect;
const sinon = require("sinon");
const setup = require("../../tests/setup");
const Create = require("../").TxCore.create;
const Validate = require("../").TxCore.validate;
const Confirm = require("../").TxCore.confirm;
const Transaction = require("../../models").Transaction;
const Node = require("../../models").Node;
const utils = require("../../utils");

describe("Transaction core", function() {
	var sandbox, fakeReqToNodes,
		tx, sign;

	beforeEach(async function() {
		await setup.setup_db();

		sandbox = sinon.createSandbox();
		fakeReqToNodes = sandbox.stub(utils, "reqToNodes");
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
		sign = "304402205cb509c59561059123a189b10305f57de9b3ee8eb3" +
			"b678a5f78dc66d5fbe6d8602201923396cab2d2301a8cd5fca03dd9baccaf56987e7055e5a97dd50aa1b331aa9";
		});

	it("should create tx", async function() {
		return Promise.resolve(Create.create(tx, sign))
			.then(function(doc) {
				expect(doc.sender).to.equal(tx.sender);
				expect(doc.inputs.toObject()).to.deep.equal(tx.inputs);
				expect(doc.outputs.toObject()).to.deep.equal(tx.outputs);
				expect(doc.id).to.not.equal(undefined);
				return Transaction.findOne();
			})
			.then(function(doc) {
				expect(doc.sender).to.equal(tx.sender);
				expect(doc.inputs.toObject()).to.deep.equal(tx.inputs);
				expect(doc.outputs.toObject()).to.deep.equal(tx.outputs);
				expect(doc.id).to.not.equal(undefined);
			})
			.catch(function(err) {
				throw err;
			})
	})

	it("should validate amount", function() {
		var temp_tx = tx;

		expect(Validate.amountValidate(temp_tx)).to.equal(null);
		temp_tx.outputs[0].amount = 1;
		expect(Validate.amountValidate(temp_tx)).to.equal(Validate.WRONG_AMOUNT);
	});

	it("should validate sign", function() {
		var temp_sign = sign;

		expect(Validate.signValidate(tx, temp_sign)).to.equal(null);

		temp_sign = temp_sign.replace("5", "f");
		expect(Validate.signValidate(tx, temp_sign)).to.equal(Validate.WRONG_SIGN);

		temp_sign = temp_sign.replace("0", "");
		expect(Validate.signValidate(tx, temp_sign)).to.equal(Validate.WRONG_SIGN);
	});

	it("should gather validate and organize data", async function() {
		fakeReqToNodes.returns(Promise.all([
			Promise.resolve({
				success: true,
				validate: false,
				nodeNum: 1
			}),
			Promise.resolve({
				success: true,
				validate: true,
				nodeNum: 2
			})
		]));

		return Promise.resolve(Validate.gatherValidate(tx, sign))
			.then(function(validates) {
				expect(validates.result).to.equal(true);
				expect(validates.consensus).to.equal(2);
				expect(validates.responses.length).to.equal(2);
			})
	});

	it("should confirm", async function() {
		var confirmed = await Create.create(tx);
		return Promise.resolve(Confirm.confirm(confirmed.toObject()))
			.then(function(doc) {
				return Transaction.find();
			})
			.then(function(txs) {
				expect(txs.length).to.equal(2);
				expect(txs[0].id).to.equal(txs[1].id);
			})
	})

	it("should create with consensus", async function() {
		fakeBroadcastConfirm = sandbox.stub(Confirm, "broadcastConfirm");
		fakeReqToNodes.returns(Promise.all([
			Promise.resolve({
				success: true,
				validate: false,
				nodeNum: 1
			}),
			Promise.resolve({
				success: true,
				validate: true,
				nodeNum: 2
			})
		]));

		return Promise.resolve(Create.createWithConsensus(tx, sign))
			.then(function(validates) {
				expect(fakeBroadcastConfirm.callCount).to.equal(1);
				expect(validates.result).to.equal(true);
				expect(validates.responses.length).to.equal(2);
				return Transaction.find();
			})
			.then(function(txs) {
				expect(txs.length).to.equal(1);
			})
	});

	it("should not create with consensus", async function() {
		fakeBroadcastConfirm = sandbox.stub(Confirm, "broadcastConfirm");
		fakeReqToNodes.returns(Promise.all([
			Promise.resolve({
				success: true,
				validate: false,
				nodeNum: 1
			}),
			Promise.resolve({
				success: true,
				validate: false,
				nodeNum: 2
			})
		]));

		return Promise.resolve(Create.createWithConsensus(tx, sign))
			.then(function(validates) {
				expect(fakeBroadcastConfirm.callCount).to.equal(0);
				expect(validates.result).to.equal(false);
				expect(validates.responses.length).to.equal(2);
				return Transaction.find();
			})
			.then(function(txs) {
				expect(txs.length).to.equal(0);
			})
	})
	
	describe.skip("Tx core Network required", function() {
		beforeEach(function() {
			sandbox.restore();
		})

		it("should gather validate result validate = true", async function() {
			var nodes = await Node.count();
			var tx = {
				sender: "0451347798bb9704b3a59d00098312e647456a0d7d0aa7f8b6" +
					"9822df6f5f70526a76208346f8881ffd5682c71badf9ee59a3d0ffd60712a9b7636dd076690c6bbb",
				inputs: [
					{ id: "id1", amount: 5 }
				],
				outputs: [
					{ receiver: "receiver", amount: 5 }
				]
			};
			var sign = "304402205cb509c59561059123a189b10305f57de9b3ee8eb3" +
				"b678a5f78dc66d5fbe6d8602201923396cab2d2301a8cd5fca03dd9baccaf56987e7055e5a97dd50aa1b331aa9";

			return Promise.resolve(Validate.gatherValidate(tx, sign))
				.then(function(validates) {
					expect(validates.result).to.equal(true);
					expect(validates.consensus).to.equal(nodes + 1);
					for (var res of validates.responses) {
						expect(res.success).to.equal(true);
						expect(res.validate).to.equal(true);
					}
				})
		})

		it("should gather validate return validate = false", async function() {
			var nodes = await Node.count();
			var tx = {
				sender: "0451347798bb9704b3a59d00098312e647456a0d7d0aa7f8b6" +
					"9822df6f5f70526a76208346f8881ffd5682c71badf9ee59a3d0ffd60712a9b7636dd076690c6bbb",
				inputs: [
					{ id: "id1", amount: 5 }
				],
				outputs: [
					{ receiver: "receiver", amount: 5 }
				]
			};
			var sign = "304402205cb509c59561059123a189b10305f57de9b3ee8eb3" +
				"b678a5f78dc66d5fbe6d8602201923396cab2d2301a8cd5fca03dd9baccaf56987e7055e5a97dd50aa1b331aa9";
			sign = sign.replace("5", "f");

			return Promise.resolve(Validate.gatherValidate(tx, sign))
				.then(function(validates) {
					expect(validates.result).to.equal(false);
					expect(validates.consensus).to.equal(0);
					for (var res of validates.responses) {
						expect(res.success).to.equal(true);
						expect(res.validate).to.equal(false);
					}
				})
		})
	});

	afterEach(async function() {
		sandbox.restore();
		await setup.reset_db();
	});
})
