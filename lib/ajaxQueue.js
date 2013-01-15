/**
 * This is an ajax request service built on top of the jQuery.ajax method and
 * the asyncQueue.
 */
define('lib/ajaxQueue', [
	'jQuery',
	'lib/asyncQueue',
	'lib/Response'
	
], function ($, asyncQ, Response) {
	var DEFAULT_DATA_TYPE	= 'json',
	/**
	 * An array of parser functions and their "routes"
	 * @type {Array.<Parser>}
	 */
	parsers	= [],
	/**
	 * Are we in debugging mode?
	 * @type {boolean}
	 */
	debug	= false,
	/**
	 * This is the parser object that will be store in the array of parsers.
	 * @param {RegExp} regex
	 * @param {string} method
	 * @param {function(Object, function)} parser
	 */
	Parser		= (function () {
		var Object	= function (regex, method, parser) {
			/**
			 * This is the regex we are going to match the url against.
			 * @type {RegExp}
			 */
			this.regex	= regex;
			/**
			 * This is the HTTP method to run this parser for
			 * @type {string} method
			 */
			this.method	= method;
			/**
			 * This is the actual parser function.
			 * @type {function}
			 */
			this.parser	= parser;
		};
		Object.prototype	= {
			/**
			 * Is the given url and method a match?
			 * @param {string} url
			 * @param {string} http_method
			 * @return {boolean}
			 */
			'isMatch': function (url, http_method) {
				if (url.match(this.regex) && http_method === this.method) {
					return true;
				}
				return false;
			},
			/**
			 * Run this parser object on the given data.
			 * @param {Object.<string,*>} data
			 * @param {function} callback
			 */
			'run': function (data, callback) {
				this.parser(data, callback);
			}
		};
		return Object;
	}()),
	/**
	 * Look through the list of parsers for a match of the given URL, if we find
	 * a match run the data through the parser function.
	 * @param {string} url
	 * @param {string} http_method
	 * @param {Object.<string,*>} data
	 * @param {function} callback
	 */
	run_parser	= function (url, http_method, data, callback) {
		var index, found, 
			count	= 0;
		
		for (index in parsers) {
			if (parsers[index].isMatch(url, http_method)) {
				count += 1;
				
				if (debug) {
					found	= found || parsers[index];
				} else {
					return parsers[index].run(data, callback);
				}
			}
		}
		
		if (debug && count > 1) {
			throw "You have multiple parsers that matched the given " +
				"url and method: url="+url+", http_method="+http_method;
		} if (found) {
			found.run(data, callback);
		}
		//If we don't find a parser just pass the given data directly to the
		//given callback, basically a no-op
		return callback(null, data);
	},
	/**
	 * Make an identifier out of the given URL and data object.
	 * @param {string} url
	 * @param {Object.<string,*>} data
	 * @return {string}
	 */
	make_key	= function (url, data) {
		var params	= data ? $.param(data) : "";
		
		return url + params;
	},
	/**
	 * Run a request of the given type
	 * @param {string} method
	 * @param {string} url
	 * @param {Object.<string,*>}
	 * @param {string} dataType
	 * @return function(callback(err, data))
	 */
	make_task	= function (method, url, data, dataType) {
		dataType	= dataType || DEFAULT_DATA_TYPE;
		data		= data || {};
		
		return function (done) {
			$[method](url, data, $.noop, dataType)
			.success(function (data, txtStatus, jqXHR) {
				run_parser(url, method, data, function (err, parsed) {
					if (err) {
						done(new Response('parseError', jqXHR, err));
						
					} else {
						done(null, new Response(txtStatus, jqXHR, parsed));
					}
				});
			})
			.error(function (jqXHR, txtStatus, errorThrown) {
				done(new Response(txtStatus, jqXHR, errorThrown));
			});
		};
	},
	/**
	 * Run a request of the given type
	 * @param {string} method
	 * @param {string} url
	 * @param {Object.<string,*>}
	 * @param {string} dataType
	 * @return {function(url, data, dataType)}
	 */
	make_run			= function (method) {
		return function (url, data, dataType) {
			var key		= make_key(url, data),
			task	= make_task(method, url, data, dataType);
			
			return asyncQ.run(key, task);
		};
	};
	
	return {
		/**
		 * @param {string} url
		 * @param {Object.<string,*>} data
		 * @param {string} dataType
		 * @return {jQuery.Deferred}
		 */
		'get': make_run('get'),
		/**
		 * @param {string} url
		 * @param {Object.<string,*>} data
		 * @param {string} dataType
		 * @return {jQuery.Deferred}
		 */
		'post': make_run('post'),
		/**
		 * Get the key for the given url and params.
		 * @param {string} url
		 * @param {Object.<string,*>} params
		 * @return {string}
		 */
		'getKey': make_key,
		/**
		 * Register a parser function. This will be called on a successful response
		 * before we pass the data on to the client listeners.  This is done 
		 * primarily because we want parsed data being passed to the end user, and
		 * if the end user caches our result they should cache the parsed result.
		 * @param {RegExp} url_regex
		 * @param {string} method
		 * @param {function (DTrade.ajaxResponse, callback} parser
		 * @return {DTrade.ajaxQueue}
		 */
		'registerParser': function (url_regex, method, parser) {
			parsers.push(new Parser(url_regex, method, parser));
			return this;
		},
		/**
		 * Turn on/off debugging
		 * @param {boolean} activate
		 * return {DTrade.ajaxQueue}
		 */
		'debugging': function (activate) {
			debug	= activate ? true : false;
			return this;
		}
	};
});