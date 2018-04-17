const net = require('net')
const Stream = require('stream').Transform
const through = require('through2')
const innerlogger = require('./middleware/logger')
const ifmatchSt = require('./middleware/noMatch')
const writeObject = require('./writeObject')

module.exports = class Server {
	constructor(options) {
		this.options = options
		this.server = null
		this.midStreams = []
	}
	/**
	 *
	 * @param {Stream} stream
	 */
	use(stream) {
		if (typeof stream != 'function') {
			throw new Error('midStream must be a transform function')
		}

		this.midStreams.push(stream)
		return this
	}
	getSocketHandler() {
		let serializer = this.options.serializer || null
		let antiSerializer = this.options.antiSerializer || null
		let beforePipe = this.options.beforePipe || noop
		let logger = this.options.logger || innerlogger
		let closeHandler = this.options.closeHandler || innerCloseHandler
		let errorHandler = this.options.errorHandler || innerErrorHandler

		return socket => {
			socket.log = logger(socket)
			beforePipe(socket)
			errorHandler.call(this.server, socket)
			closeHandler(socket)

			socket.streams = []
			let stream = socket
			process.nextTick(() => {
				if (antiSerializer) {
					stream = stream.pipe(antiSerializer(socket))
					socket.streams.push(stream)
				}
				socket.log.inlog(stream)

				this.midStreams.forEach(st => {
					let fn = st(socket)
					if (typeof fn !== 'function') {
						return
					}
					stream = stream.pipe(through({ objectMode: true }, fn))
					socket.streams.push(stream)
				})

				if (this.midStreams.length) {
					stream = stream.pipe(through({ objectMode: true }, ifmatchSt))
					socket.streams.push(stream)
				}

				if (serializer) {
					stream = stream.pipe(serializer(socket))
					socket.writeObject = writeObject(stream)
					socket.streams.push(stream)
				}
				socket.log.outlog(stream)
				stream.pipe(socket)
			})
		}
	}
	callback() {
		return socket => {
			let handler = this.getSocketHandler()
			handler(socket)
		}
	}
	listen(port) {
		this.server = net.createServer(this.callback())
		this.server.on('error', e => {
			console.error('Server has an Error: ' + e.message)
		})
		return this.server.listen(port, () => {
			console.log('Server is running at port: ' + port)
		})
	}
}

/**
 * @param {net.Socket} socket
 */
const innerErrorHandler = function(socket) {
	socket.on('error', e => {
		console.error('socket has an Error: ' + e.message)
		this.getConnections((err, count) => {
			if (err) {
				console.error('getConnection Error: ' + err.message)
			} else {
				console.log('current connections: ' + count)
			}
		})
	})
}

/**
 * @param {net.Socket} socket
 */
const innerCloseHandler = socket => {
	socket.on('finish', () => {
		console.log('finish')
	})
	socket.on('close', hErr => {
		console.info('socket closed', hErr)
		socket.log = null
		socket.streams.forEach(st => {
			st.unpipe()
			st.destroy()
		})
		socket.unpipe()
		socket.destroy()
		socket = null
	})
}

const noop = socket => {}
