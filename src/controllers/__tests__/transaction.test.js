const expect = require("chai").expect;
const sinon = require("sinon");
const setup = require("../../tests/setup");
const TxController = require("../").TxController;
const Validate = require("../../core").TxCore.validate;
const Create = require("../../core").TxCore.create;
const Transaction = require("../../models").Transaction;
const NOT_ENOUGH_DATA = require("../../utils").NOT_ENOUGH_DATA;

describe("Tx controller", function() {
	var sandbox, fakeValidate;
	var res = {
			json: function(body) {
				this.body = body
			},
			body: {}
		}

	beforeEach(async function() {
		await setup.setup_db();

		sandbox = sinon.createSandbox();
		fakeValidate = sandbox.stub(Validate, "validate");
	});

	it("should create tx", async function() {
		var fakeCreateWithConsensus = sandbox.stub(Create, "createWithConsensus");
		fakeCreateWithConsensus.returns(Promise.resolve({ 
			result: true,
			consensus: 2,
			responses: [ 
				{ success: true, validate: false, nodeNum: 1 },
				{ success: true, validate: true, nodeNum: 2 } 
			]
		}));
		var req = { body: {
			transaction: {
				sender: "sender",
				inputs: [
					{ id: "id1", amount: 5 }
				],
				outputs: [
					{ receiver: "receiver", amount: 5 }
				]
			},
			sign: " "
		}};

		return Promise.resolve(TxController.create(req, res))
			.then(function() {
				expect(res.body.success).to.equal(true);
				expect(res.body.result).to.equal(true);
				expect(res.body.consensus).to.equal(2);
				expect(res.body.responses.length).to.equal(2);
			})
			.catch(function(err) {
				throw err;
			})
	});

	it("should not create tx", async function() {
		var fakeCreateWithConsensus = sandbox.stub(Create, "createWithConsensus");
		var consensus = 1;
		fakeCreateWithConsensus.returns(Promise.resolve({ 
			result: false,
			consensus,
			responses: [ 
				{ success: true, validate: false, nodeNum: 1 },
				{ success: true, validate: false, nodeNum: 2 } 
			]
		}));
		var req = { body: {
			transaction: {
				sender: "sender",
				inputs: [
					{ id: "id1", amount: 5 }
				],
				outputs: [
					{ receiver: "receiver", amount: 5 }
				]
			},
			sign: " "
		}};

		return Promise.resolve(TxController.create(req, res))
			.then(function() {
				expect(res.body.success).to.equal(true);
				expect(res.body.result).to.equal(false);
				expect(res.body.consensus).to.equal(consensus);
				expect(res.body.responses.length).to.equal(2);
			})
			.catch(function(err) {
				throw err;
			})
	});

	it("should throw error with not enough data msg", async function() {
		var transaction = {
			sender: "sender",
			inputs: [
				{ id: "id1", amount: 5 }
			],
		};
		var sign = " ";
		var req = { body: {
			transaction, sign
		}};

		return Promise.resolve(TxController.create(req, res))
			.then(function() {
				expect(res.body).to.deep.equal(
					{ success: false, message: NOT_ENOUGH_DATA }
				);
			})
	});

	it("should validate tx", function() {
		fakeValidate.returns(null);
		var transaction = {
			sender: "sender",
			inputs: [
				{ id: "id1", amount: 5 }
			],
			outputs: [
				{ receiver: "receiver", amount: 5 }
			]
		};
		var sign = " ";
		var req = { body: {
			transaction, sign
		}};
		var expected_res = {
			success: true,
			validate: true,
			nodeNum: process.env["SERVER_NUM"]
		}

		TxController.validate(req, res);
		expect(res.body.success).to.equal(expected_res.success);
		expect(res.body.validate).to.equal(expected_res.validate);
		expect(res.body.nodeNum).to.equal(expected_res.nodeNum);
		expect(res.body.message).to.equal(undefined);
	});

	it("should show message with wrong amount or sign", function() {
		var transaction = {
			sender: "sender",
			inputs: [
				{ id: "id1", amount: 5 }
			],
			outputs: [
				{ receiver: "receiver", amount: 5 }
			]
		};
		var sign = " ";
		var req = { body: {
			transaction, sign
		}};
		var expected_res = {
			success: true,
			validate: false,
			nodeNum: process.env["NODE_NUM"]
		}

		fakeValidate.returns(Validate.WRONG_AMOUNT);
		TxController.validate(req, res);
		expect(res.body.success).to.equal(expected_res.success);
		expect(res.body.validate).to.equal(expected_res.validate);
		expect(res.body.nodeNum).to.equal(expected_res.nodeNum);
		expect(res.body.message).to.equal(Validate.WRONG_AMOUNT);

		fakeValidate.returns(Validate.WRONG_SIGN);
		TxController.validate(req, res);
		expect(res.body.success).to.equal(expected_res.success);
		expect(res.body.validate).to.equal(expected_res.validate);
		expect(res.body.nodeNum).to.equal(expected_res.nodeNum);
		expect(res.body.message).to.equal(Validate.WRONG_SIGN);
	})

	it("should confirm", async function() {
		var tx = new Transaction({
			sender: "sender",
			inputs: [
				{ id: "id1", amount: 5 }
			],
			outputs: [
				{ receiver: "receiver", amount: 5 }
			]
		});
		await tx.makeId();
		await tx.save();
		var req = {
			body: tx.toObject()
		}

		return Promise.resolve(TxController.confirm(req, res))
			.then(function() {
				expect(res.body.success).to.equal(true);
			});
	})

	describe.skip("Tx controller Network required", async function() {
		it("should create tx", async function() {
			var req = { body: {
				transaction: {
					sender: "0451347798bb9704b3a59d00098312e647456a0d7d0aa7f8b6" +
						"9822df6f5f70526a76208346f8881ffd5682c71badf9ee59a3d0ffd60712a9b7636dd076690c6bbb",
					inputs: [
						{ id: "id1", amount: 5 }
					],
					outputs: [
						{ receiver: "receiver", amount: 5 }
					]
				},
				sign: "304402205cb509c59561059123a189b10305f57de9b3ee8eb3" +
					"b678a5f78dc66d5fbe6d8602201923396cab2d2301a8cd5fca03dd9baccaf56987e7055e5a97dd50aa1b331aa9"
			}};

			return Promise.resolve(TxController.create(req, res))
				.then(function() {
					expect(res.body.success).to.equal(true);
					expect(res.body.result).to.equal(true);
					expect(res.body.consensus).to.equal(3);
					expect(res.body.responses.length).to.equal(2);
					return Transaction.find();
				})
				.then(function(txs) {
					expect(txs.length).to.not.equal(0);
				})
				.catch(function(err) {
					throw err;
				})
		})

		it("should create tx", async function() {
			var req = { body: {
				transaction: {
					sender: "0451347798bb9704b3a59d00098312e647456a0d7d0aa7f8b6" +
						"9822df6f5f70526a76208346f8881ffd5682c71badf9ee59a3d0ffd60712a9b7636dd076690c6bbb",
					inputs: [
						{ id: "id1", amount: 5 }
					],
					outputs: [
						{ receiver: "receiver", amount: 5 }
					]
				},
				sign: "304402205cb509c59561059123a189b10305f57de9b3ee8eb3" +
					"b678a5f78dc66d5fbe6d8602201923396cab2d2301a8cd5fca03dd9baccaf56987e7055e5a97dd50aa1b331aa0"
				// last 0 is originally 9
			}};

			return Promise.resolve(TxController.create(req, res))
				.then(function() {
					console.log(res.body)
					expect(res.body.success).to.equal(true);
					expect(res.body.result).to.equal(false);
					expect(res.body.consensus).to.equal(0);
					expect(res.body.responses.length).to.equal(2);
				})
				.catch(function(err) {
					throw err;
				})
		})
	});

	afterEach(async function() {
		sandbox.restore();
		await setup.reset_db();
	});
});
