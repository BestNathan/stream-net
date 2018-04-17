const Router = require('../streamRouter')
const userModel = require('../../models/user')
const { responseFailure, responseSuccess } = require('../nextResponseHelper')
const router = new Router()

module.exports = router

router
	.setKey('method')
	.method('login', socket => {
		return (data, enc, next) => {
			let { username, password, software } = data
			if (!username || !password || !software) {
				return responseFailure(next, '请填写用户名，密码以及软件名')
			}

			userModel
				.findOne({ username })
				.populate('software')
				.exec((err, doc) => {
					if (err) {
						return responseFailure(next, err.message)
					}

					if (!doc) {
						return responseFailure(next, '用户不存在，请重新输入')
					}

					if (password !== doc.password) {
						return responseFailure(next, '用户名或密码不正确，请重新输入')
					}

					if (doc.authorization == 'admin') {
						return responseSuccess(next, '登录成功')
					}

					if (software !== doc.software.name) {
						return responseFailure(next, '用户未授权该软件，请联系管理员')
					}

					return responseSuccess(next, '登录成功')
				})
		}
	})
	.method('lookup', socket => {
		return (data, _, next) => {
			let { limit, skip } = data
			userModel.find(
				{},
				'-_id -__v',
				{
					limit,
					skip
				},
				(err, docs) => {
					if (err) {
						return responseFailure(next, err.message)
					}

					return responseSuccess(next, '查询成功', { docs })
				}
			)
		}
	})
	.method('deviceIn', socket => {
		return (data, _, next) => {
			let { device } = data
			console.log(`[${socket.remoteAddress}:${socket.remotePort}][deviceIn] deviceID: ${device}`)
			return responseSuccess(next, 'method test', { next: { command: 'command' } })
		}
	})
