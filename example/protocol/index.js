const { Socket } = require('net')
const through = require('through2')

/**
 *
 * @param {Socket} socket
 */
const antiSerializer = socket => {
	return through(function trans(chunk, enc, next) {
		let key = socket.key
		let buf = Buffer.from(chunk)
		if (socket.buffer) {
			buf = Buffer.concat([socket.buffer, buf])
			socket.buffer = null
		}

		let len = buf.readUInt32BE(0)
		let offset = 4
		if (len > 16 * 1024) {
			return next()
		}

		if (len > buf.byteLength) {
			socket.buffer = buf
			return next()
		}

		buf = buf.slice(offset, len)

		for (let index = 0; index < len; index++) {
			buf[index] = buf[index] ^ key[index % key.length]
		}
		this.push(buf)
		next()
	})
}
/**
 *
 * @param {Socket} socket
 */
const serializer = socket => {
	let key = socket.key
	return through(function trans(chunk, enc, next) {
		chunk = Buffer.from(chunk)
		let len = chunk.length
		for (let index = 0; index < len; index++) {
			chunk[index] = chunk[index] ^ key[index % key.length]
		}

		let header = new Buffer(4)
		header.writeInt32BE(len + 4)
		chunk = Buffer.concat([header, chunk])

		this.push(chunk)
		next()
	})
}

module.exports = {
	antiSerializer,
	serializer
}
