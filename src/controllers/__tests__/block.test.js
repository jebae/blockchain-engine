const expect = require("chai").expect;
const sinon = require("sinon");
const setup = require("../../tests/setup");
const BlockController = require("../block");
const Block = require("../../models").Block;

describe("Block controller", function() {
	var sandbox, fakeIsValidProof, prevBlock,
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
		prevBlock = new Block({
			prevBlockHash: "000002d5e6c91021440e41a7624e4733807dfd3e06ad15765a6f359f3c6041fa",
			merkleRootHash: " ",
			txs : [ ],
			timestamp : 1527676984063,
			nonce : 168929
		});
	});


	afterEach(async function() {
		sandbox.restore();
		await setup.reset_db();
	});
})
