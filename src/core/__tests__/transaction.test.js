const expect = require("chai").expect;
const setup = require("../../tests/setup");
const TxCore = require("../transaction");
const Transaction = require("../../models").Transaction;

describe("Transaction core", function() {
	beforeEach(async function() {
		await setup.setup_db();
	});

	it("should create tx", async function() {
		var tx = {
			sender: "sender",
			receiver: "receiver",
			amount: 5
		};

		return Promise.resolve(TxCore.create(tx))
			.then(function(doc) {
				expect(doc.sender).to.equal(tx.sender);
				expect(doc.receiver).to.equal(tx.receiver);
				expect(doc.amount).to.equal(tx.amount);
				expect(doc.id).to.not.equal(undefined);
				return Transaction.findOne();
			})
			.then(function(doc) {
				expect(doc.sender).to.equal(tx.sender);
				expect(doc.receiver).to.equal(tx.receiver);
				expect(doc.amount).to.equal(tx.amount);
				expect(doc.id).to.not.equal(undefined);
			})
			.catch(function(err) {
				throw err;
			})
	})

	afterEach(async function() {
		await setup.reset_db();
	});
})
