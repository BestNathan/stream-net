const crypto = require('crypto')
const through = require('through2')
const Server = require('../index').Server

const commandRoutes = require('./router/commandRoutes')
const { antiSerializer, serializer } = require('./protocol')

/**
 * @param {net.Socket} socket
 */
const generateKey = socket => {
	let key = crypto.randomBytes(4)
	socket.key = key
	socket.write(key)
}

const server = new Server({
	serializer,
	antiSerializer,
	beforePipe: generateKey
})

server.use(commandRoutes.getStream())

server.listen(8431)
