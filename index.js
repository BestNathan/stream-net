const { responseSuccess, responseFailure, noresponse } = require('./lib/nextResponseHelper')
const Router = require('./lib/streamRouter')
Router.responseSuccess = responseSuccess
Router.responseFailure = responseFailure
Router.noresponse = noresponse
module.exports = {
	Server: require('./lib/server'),
    Router
}
