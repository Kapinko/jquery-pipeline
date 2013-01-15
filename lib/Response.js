define('lib/Response', [
	
], function () {
	/**
	 * This is the object that will be returned from every request.
	 * @param {string} status
	 * @param {jqXHR} jqXHR
	 * @param {*} body
	 */
	var	Response	= function (status, jqXHR, body) {
		/**
		 * This is the text status returned from the server.
		 * @type {string}
		 */
		this.status	= status;
		/**
		 * This is the jqXHR request created by jQuery.
		 * @type {jqXHR}
		 */
		this.req	= jqXHR;
		/**
		 * This is the body of the response.
		 * @type {*}
		 */
		this.res	= body;
	};
	return Response;
});