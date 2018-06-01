const expect = require("chai").expect;
const setup = require("../../tests/setup");
const Transaction = require("../").Transaction;
const Block = require("../").Block;

describe("Transaction Model", function() {
	beforeEach(async function() {
		await setup.setup_db();
	});

	it("should return saved tx", async function() {
		var saved;
		var tx = new Transaction({
			sender: "sender",
			receiver: "receiver",
			amount: 5
		});
		tx.makeId();
		await tx.save();

		saved = await Transaction.findOne();
		expect(saved.sender).to.equal(tx.sender);
		expect(saved.receiver).to.equal(tx.receiver);
		expect(saved.amount).to.equal(tx.amount);
		expect(saved.id).to.equal(tx.id);
	});

	afterEach(async function() {
		await setup.reset_db();
	});
})
