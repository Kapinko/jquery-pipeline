/**
 * A simple in memory object cache.
 */

define('lib/cache', [], function () {
		/**
		 * @type {number}
		 */
	var DEFAULT_TTL	= 5000, //Default time-to-live is 5 seconds.
		/**
		 * @type {Object.<string,Store>}
		 */
		cache		= {},
		/**
		 * A prototype for a cache store object.
		 * @param {*} value
		 * @param {number} ttl
		 */
		Entry		= function (value, ttl) {
			ttl	= parseInt(ttl, 10);
				
			if (isNaN(ttl)) { ttl	= DEFAULT_TTL; }
			
			/**
			 * The stored value.
			 * @type {*}
			 */
			this.value	= value;
			/**
			 * This is the timestamp of when this value was stored.
			 * @type {number}
			 */
			this.ts		= new Date().getTime();
			/**
			 * This is the time-to-live for this object in microseconds
			 * @type {number}
			 */
			this.ttl	= ttl;
		}
	;
	
	Entry.prototype	= {
		/**
		 * Return the value stored in this store object.
		 * @return {*}
		 */
		'getValue': function () {
			return this.value;
		},
		/**
		 * Has this store expired?
		 * @return {boolean}
		 */
		'isExpired': function () {
			var now	= new Date().getTime(),
				age	= now - this.ts
			;
			return age > this.ttl ? true : false;
		}
	};
		
	/**
	 * This is the Cache object interface.
	 */
	Cache	= {
		/**
		 * Read a value out of the cache.
		 * @param {string} key
		 * @return {*}
		 */
		'get': function (key) {
			if (cache.hasOwnProperty(key) && !cache[key].isExpired()) {
				return cache[key].getValue();
			}
			return null;
		},
		/**
		 * Post a value into the cache.
		 * @param {string} key
		 * @param {*} value
		 * @param {number} ttl
		 * @return {DTrade.Cache}
		 */
		'put': function (key, value, ttl) {
			cache[key]	= new Entry(value, ttl);
			return this;
		},
		/**
		 * Delete a specific cache item.
		 * @param {string} key
		 * @return {DTrade.Cache}
		 */
		'del': function (key) {
			delete cache[key];
			return this;
		},
		/**
		 * Clear the entire cache.
		 * @return {DTrade.Cache}
		 */
		'clear': function () {
			cache	= {};
			return this;
		}
	};
	return Cache;
});