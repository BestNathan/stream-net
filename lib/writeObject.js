const Stream = require('stream').Transform

function trystringify(obj) {
	try {
		return Buffer.isBuffer(obj) ? JSON.stringify(obj.toString()) : JSON.stringify(obj)
	} catch (e) {
		return obj.toString()
	}
}
/**
 *
 * @param {Stream} stream
 */
module.exports = stream => {
	return obj => {
		stream.write(trystringify(obj))
	}
}
