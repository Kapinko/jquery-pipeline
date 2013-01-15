/**
 * This uses the ajaxQueue and cache objects to present an interface to AJAX
 * services that is both cached and queued.
 */
define('lib/ajaxService', [
	'lib/cache',
	'lib/ajaxQueue'
], function (cache, queue) {
	/**
	 * Create the function for the given HTTP method.
	 * @param {string} method
	 * @param {boolean} no_cache
	 * @return {function (string, Object.<string,*>, string))
	 */
	var	make_http_method	= function (method, no_cache) {
		return function (url, params, dataType, ttl) {
			ttl	= parseInt(ttl, 10);
			
			var disable_cache	= (no_cache || (ttl === NaN && ttl <= 0) ? true : false),
				cached	= null, 
				key, deferred;
				
			if (!disable_cache) {
				key		= queue.getKey(url, params);
				cached	= cache.get(key);
			}
				
			if (cached) {
				deferred	= new $.Deferred();
				
				//We do this to allow the user to attach handlers.
				setTimeout(function () {
					deferred.resolveWith(null, [null, cached]);
				}, 0);
			} else {
				deferred	= queue[method](url, params, dataType);
				
				if (!disable_cache) {
					//If we have caching enabled we attach our own fancy handler
					//to store the result in cache.
					deferred.done(function (err, response) {
						cache.put(key, response);
					});
				}
			}
			
			return deferred;
		};
	};
	
	return {
		/**
		 * Make a get request to the server.
		 * @param {string} url
		 * @param {Object.<string,*>} params
		 * @param {string} dataType
		 * @param {boolean} ttl - the time to live on the cache
		 * @return {jQuery.Deferred}
		 */
		'get': make_http_method('get', false),
		/**
		 * Send a post request to the server.
		 * @param {Object.<string,*>} params
		 * @param {string} dataType
		 * @return {jQuery.Deferred}
		 */
		'post': make_http_method('post', true),
		/**
		 * Register a parser function. This will be called on a successful response
		 * before we pass the data on to the client listeners.
		 * @param {RegExp} url_regex
		 * @param {string} method
		 * @param {function (DTrade.ajaxResponse, callback} parser
		 * @return {DTrade.ajaxService}
		 */
		'registerParser': queue.registerParser
	};
});