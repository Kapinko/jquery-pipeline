/**
 * This is an implementation of an asynchronous queue.  This will make an initial
 * attempt to run a task and will queue any additional requests to that task until
 * the task has finished processing.
 */
define('lib/asyncQueue', [
	'jQuery'
], function ($) {
		/**
		 * This is list of task queues.
		 * @type {Object.<string,*>}
		 */
	var queue_list	= {},
	
	/**
	 * This is the interface into the asynchronous queue mechanism.
	 */
	asyncQueue	= {
		/**
		 * Run a queueable task.
		 * @param {string} id - the identifier for the given task.
		 * @param {function(callback(complete))} task
		 * @return {jQuery.Deferred}
		 */
		'run': function (id, task) {
			var deferred;
			
			if (!queue_list.hasOwnProperty(id)) {
				deferred	= new $.Deferred();
				
				queue_list[id]	= deferred;
				
				//delay so we give the user to attach handler functions.
				setTimeout(function () {
					task(function (err, result) {
						//We can do this here because of JavaScript's single
						//threaded nature.
						delete queue_list[id];
						
						if (err) {
							deferred.rejectWith(null, [err, result]);
						} else {
							deferred.resolveWith(null, [err, result]);
						}
					});
				}, 0);
				
			} else {
				deferred	= queue_list[id];
			}
			return deferred;
		}
	};
	return asyncQueue
});