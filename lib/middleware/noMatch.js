module.exports = (chunk, enc, next) => {
	if (typeof chunk == 'string' || chunk.nomatch) {
		return next(
			null,
			trystringify({
				status: 'fail',
				message: 'no matched method!'
			})
		)
	}

	delete chunk.routerhandle
	delete chunk.nomatch
	return next(null, trystringify(chunk))
}

function trystringify(obj) {
	try {
		return Buffer.isBuffer(obj) ? JSON.stringify(obj.toString()) : JSON.stringify(obj)
	} catch (e) {
		return obj.toString()
	}
}
