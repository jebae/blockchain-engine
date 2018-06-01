const expect = require("chai").expect;
const sinon = require("sinon");
const setup = require("../../tests/setup");
const TxController = require("../transaction");
const Transaction = require("../../models").Transaction;

describe("Tx controller", function() {
	var res = {
			json: function(body) {
				this.body = body
			},
			body: {}
		}

	beforeEach(async function() {
		await setup.setup_db();
	});

	it("should create tx", async function() {
		var tx = new Transaction({
			sender: "sender",
			receiver: "receiver",
			amount: 7
		});
		var req = { body: tx };

		return Promise.resolve(TxController.create(req, res))
			.then(function() {
				expect(res.body).to.deep.equal({ success: true, message: "New transaction is created" });
				return Transaction.find();
			})
			.then(function(tx) {
				expect(tx.length).to.equal(1);
			})
			.catch(function(err) {
				throw err;
			})
	});

	it("should throw error with not enough data msg", async function() {
		var tx = {
			sender: "sender",
			receiver: "receiver",
		};
		var req = { body: tx };

		TxController.create(req, res);
		expect(res.body).to.deep.equal({ success: false, message: "NOT ENOUGH DATA" });
	});

	afterEach(async function() {
		await setup.reset_db();
	});
});
