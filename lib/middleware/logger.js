const { Socket } = require('net')
const rotateStream = require('file-stream-rotator')
const path = require('path')

const cwd = process.cwd()

/**
 *
 * @param {String} string
 */
const getip = string => {
	return string.replace(/f/g, '').replace(/:/g, '')
}

/**
 *
 * @param {object | null} opt
 * @returns {inlog:(stream) =>{},outlog:(stream) =>{}}
 */
module.exports = socket => {
	let logStream = rotateStream.getStream({
		filename: path.resolve(cwd, './log/tcp-log.log'),
		frequency: 'daily'
	})
	let ip = getip(socket.remoteAddress)
	let port = socket.remotePort

	return {
		inlog: stream => {
			stream.on('data', data => {
				console.log(`<<<< [${ip}:${port}] | ${data.length}`)
				process.nextTick(() => {
					logStream && logStream.write(data)
				})
			})
		},
		outlog: stream => {
			let owirte = stream.write
			stream.write = buffer => {
				console.log(`>>>> [${ip}:${port}] | ${buffer.length}`)
				owirte.call(stream, buffer)
				process.nextTick(() => {
					logStream && logStream.write(buffer)
				})
			}
		}
	}
}
