const through = require('through2')
const Stream = require('stream').Transform
const writable = require('stream').Writable
const { Socket } = require('net')

module.exports = class streamRouter {
	constructor() {
		/**
		 *
		 * @type {Stream[]}
		 */
		this.midStreams = []
		this.key = null
		this.methods = {}
	}
	setKey(key) {
		this.key = key
		return this
	}
	getStream() {
		return socket => {
			return (chunk, enc, next) => {
				let data = this.tryparse(chunk)
				let fn,
					opt = { objectMode: true }

				if (data.routerhandle) {
					return next(null, data)
				}

				let match = this.match(data)
				if (!match) {
					if (typeof data !== 'string' && !data.routerhandle) {
						data.nomatch = true
					}
					next(null, data)
					return
				}

				match = match(socket)
				if (typeof match != 'function') {
					next(null, data)
					return
				}

				let firstStream = null,
					stream = null
				if (this.midStreams.length) {
					for (let index = 0; index < this.midStreams.length; index++) {
						fn = this.midStreams[index](socket)
						if (typeof fn == 'function') {
							if (index == 0) {
								firstStream = through(opt, fn)
								stream = firstStream
							} else {
								stream = stream.pipe(through(opt, fn))
							}
						}
					}
				}

				if (stream) {
					stream = stream.pipe(through(opt, match))
				} else {
					stream = through(opt, match)
					firstStream = stream
				}

				stream.on('data', sdata => {
					sdata.routerhandle = true
					next(null, sdata)
				})

				firstStream.write(data)
			}
		}
	}
	/**
	 *
	 * @param {(chunk, encoding, callback) => {}} midStream
	 */
	use(midStream) {
		if (typeof midStream != 'function') {
			throw new Error('midStream must be transform function')
		}

		this.midStreams.push(midStream)
		return this
	}
	/**
	 *
	 * @param {String} name
	 * @param {(socket: Socket) => {}} stream
	 */
	method(name, stream) {
		if (typeof stream != 'function') {
			throw new Error('stream must be transform function')
		}

		this.methods[name] = stream
		return this
	}
	/**
	 *
	 * @param {Buffer | String} chunk
	 * @returns {Stream}
	 */
	match(data) {
		if (!this.key) {
			return false
		}
		let method = data[this.key]
		if (!method) {
			return false
		}

		if (!this.methods[method]) {
			return false
		}

		return this.methods[method]
	}
	tryparse(buffer) {
		if (!Buffer.isBuffer(buffer) && typeof buffer !== 'string') {
			return buffer
		}
		let str = buffer.toString()

		try {
			return JSON.parse(str)
		} catch (e) {
			return str
		}
	}
}
