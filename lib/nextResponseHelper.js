const responseFailure = (next, message, obj) => {
	let res = { status: 'fail', message }
	if (obj && typeof obj == 'object') {
		Object.assign(res, obj)
	}
	return next(null, res)
}

const responseSuccess = (next, message, obj) => {
	let res = { status: 'success', message }
	if (obj && typeof obj == 'object') {
		Object.assign(res, obj)
	}
	return next(null, res)
}

const noresponse = next => {
	return next()
}

module.exports = {
	responseFailure,
	responseSuccess,
	noresponse
}
