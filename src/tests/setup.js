const db = require("mongoose");
const models = require("../models");

const setup_db = async function() {
	db.models = {};
	db.modelSchemas = {};
	await db.connect(models.DB_ADDRESS + "_test");
}

const reset_db = async function() {
	var collections = Object.keys(db.connection.collections);

	for (let c of collections) {
		db.connection.collections[c].remove();
	}
	await db.disconnect();
}

module.exports = {
	setup_db,
	reset_db
}
