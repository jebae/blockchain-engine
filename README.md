# blockchain-engine

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/bcce78e82f2748f7b88cd55ec06ed2b8)](https://www.codacy.com/manual/jebae/blockchain-engine?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=jebae/blockchain-engine&amp;utm_campaign=Badge_Grade)

**blockchain-engine** follows basic principles of bitcoin. It roles as miner of bitcoin.

Blocks and transactions are saved in mongodb. Before saving transaction, engine validate it by consensus with other engine nodes.

<br><br>

## Requirements

Must have following environment variables.

```shell
# mongodb host
DB_HOST

# mongodb database name
DB_NAME

# express server port
PORT

# index of my node
NUM_NODE

# miner public key (private key has to saved in database before launch engine)
MINER_PUBKEY
```

<br><br>

## Installation

```shell
npm install
```

<br><br>

## Features

- Create genesis block.
- Validate transaction with other nodes. (consensus)
- Proof of work

<br><br>

### request

**/transaction/create** `POST`

Node validates transaction and sends same data to other nodes to gather validation. If transaction is valid, save data in database.

Response when transaction is valid

```json
{
	"success" : true,
	"message" : "New transaction is created"
}
```

<br>

Response when transaction is invalid

```json
{
	"success" : true,
	"message" : "Transaction is invalid"
}
```

<br><br>

**/transaction/validate** `POST`

Only check if transaction is valid and response result.

Response when transaction is valid.

```json
{
	"success" : true,
	"validate": true,
	"nodeNum" : <index of node>
}
```

<br>

Response when transaction is invalid

```json
{
	"success" : true,
	"validate": false,
	"nodeNum" : <index of node>,
	"message" : <message>
}
```

<br><br>

**/transaction/confirm** `post`

Node save confirmed transaction by consensus.

<br><br>

**/utxo/:client** `GET`

Get utxo(unspent transaction output) of `client`.

Response

```json
[
	{
		"id" : <hash id of transaction>,
		"sender" : <sender id of transaction>,
		"inputs" : [ ... ],
		"outputs" : [ ... ],
		"timestamp" : <unix timestamp>,
		"spent" : false
	}
]
```

<br><br>

**/chain** `GET`

Get blockchain.