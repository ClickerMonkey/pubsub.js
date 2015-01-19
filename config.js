
module.exports = 
{
	/**
	 * The port the application listens on.
	 */
	port: 3000,
	
	/**
	 * Whether or not to send a publish message back to the client who sent it.
	 */
	echoPublish: false,
	
	/**
	 * Whether or not to send all of the join tokens of current clients to the 
	 * new client when they first join the channel.
	 */
	sendExistingClientsOnJoin: true,
	
	/**
	 * The data types that are valid channel IDs
	 */
	validIds: 
	{
		'number': true,
		'string': true,
		'boolean': true,
		'object': false,
		'undefined': false
	}
	
};