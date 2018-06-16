const Node = require("../models").Node;
const axios = require("axios");
const NOT_ENOUGH_DATA = "Not enough data";

function validateRequestBody(req, required) {
	for (var attr in required) {
		if (!req.body[attr]) {
			return NOT_ENOUGH_DATA;
		}

		switch (typeof required[attr]) {
			case "object":
				for (var detail of required[attr]) {
					if (!req.body[attr][detail]) {
						return NOT_ENOUGH_DATA;
					}
				}
				break;
		}
	}
	return null;
}

function reqToNodes(url, data, cb) {
	var responses = [];

	return Node.find()
		.then(function(nodes){
			for (var node of nodes) {
				responses.push(
					axios.post(`http://${node.address}${url}`, data)
						.then(cb)
						.catch(function (err) {
							return {
								success: false
							};
						})
				);
			}
			return Promise.all(responses);
		});
}

module.exports = {
	validateRequestBody,
	reqToNodes,
	NOT_ENOUGH_DATA
}
