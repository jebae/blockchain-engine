const expect = require("chai").expect;
const sinon = require("sinon");
const EC = require("elliptic").ec;
const Crypto = require("crypto");
const setup = require("../../tests/setup");
const TxController = require("../").TxController;
const Validate = require("../../core").TxCore.validate;
const Create = require("../../core").TxCore.create;
const Transaction = require("../../models").Transaction;
const NOT_ENOUGH_DATA = require("../../utils").NOT_ENOUGH_DATA;

describe("Tx controller", function() {
	var sandbox, fakeValidate;
	var tx, sign;
	var res = {
			json: function(body) {
				this.body = body
			},
			body: {}
		}

	beforeEach(async function() {
		await setup.setup_db();

		const ec = new EC("secp256k1");
		const key = ec.genKeyPair();
		const privatekey = key.getPrivate("hex");
		const pubkey = key.getPublic("hex");
		tx = {
			sender: pubkey,
			inputs: [
				{ id: "id1", amount: 5 }
			],
			outputs: [
				{ receiver: "receiver", amount: 5 }
			],
			timestamp: Date.now()
		};
		var msghex = Crypto.createHash("sha256").update(JSON.stringify(tx)).digest("hex");
		sign = ec.keyFromPrivate(privatekey, "hex").sign(msghex).toDER("hex");
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
				],
				timestamp: Date.now()
			},
			sign: " ",
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
			transaction: tx,
			sign
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
		fakeValidate.returns(Promise.resolve(null));
		var req = { body: {
			transaction: tx, sign
		}};
		var expected_res = {
			success: true,
			validate: true,
			nodeNum: process.env["SERVER_NUM"]
		}

		return Promise.resolve(TxController.validate(req, res))
			.then(function() {
				expect(res.body.success).to.equal(expected_res.success);
				expect(res.body.validate).to.equal(expected_res.validate);
				expect(res.body.nodeNum).to.equal(expected_res.nodeNum);
				expect(res.body.message).to.equal(undefined);
			});
	});

	it("should show message with wrong amount or sign", function() {
		var req = { body: {
			transaction: tx, sign
		}};
		var expected_res = {
			success: true,
			validate: false,
			nodeNum: process.env["NODE_NUM"]
		}

		fakeValidate.returns(Promise.resolve(Validate.WRONG_AMOUNT));
		return Promise.resolve(TxController.validate(req, res))
			.then(function() {
				expect(res.body.success).to.equal(expected_res.success);
				expect(res.body.validate).to.equal(expected_res.validate);
				expect(res.body.nodeNum).to.equal(expected_res.nodeNum);
				expect(res.body.message).to.equal(Validate.WRONG_AMOUNT);
			})
			.then(function() {
				fakeValidate.returns(Promise.resolve(Validate.WRONG_SIGN));
				return TxController.validate(req, res);
			})
			.then(function() {
				expect(res.body.success).to.equal(expected_res.success);
				expect(res.body.validate).to.equal(expected_res.validate);
				expect(res.body.nodeNum).to.equal(expected_res.nodeNum);
				expect(res.body.message).to.equal(Validate.WRONG_SIGN);
			});
	})

	it("should confirm", async function() {
		var transaction = new Transaction(tx);
		await transaction.makeId();
		await transaction.save();
		var req = {
			body: transaction.toObject()
		}

		return Promise.resolve(TxController.confirm(req, res))
			.then(function() {
				expect(res.body.success).to.equal(true);
			});
	})

	describe.skip("Tx controller Network required", async function() {
		it("should create tx", async function() {
			var req = { body: {
				transaction: tx,
				sign 
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

		it("should not create tx", async function() {
			var wrongSign = sign.replace("5", "f");
			var req = { body: {
				transaction: tx,
				sign: wrongSign
				// last 0 is originally 9
			}};

			return Promise.resolve(TxController.create(req, res))
				.then(function() {
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
