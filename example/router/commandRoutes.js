const Router = require('../../index').Router
const { responseFailure, responseSuccess } = Router
const router = new Router()

module.exports = router

router
	.setKey('command')
	.method('command', socket => {
		return (data, _, next) => {
			socket.writeObject({ test: 'test write obejct' })
			return responseSuccess(next, 'command test', { next: { method: 'e' } })
		}
	})
