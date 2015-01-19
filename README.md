# pubsub.js
A simple publish/subscribe server &amp; client written in javascript.

### Installing

```
npm install
```

### Running Server

```
node pubsub-server.js
```

### Configuration (config.js)

```js
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
```

### Client Code

```js
var pubsub = new PubSub('localhost:3000');
var channel = pubsub.subscribe('channel ID', 'user metadata');
channel.echo = true;
channel.receive = function(data) {
  console.log('data received:', data);
};
channel.join = function(user) {
  console.log('user join:', user);
};
channel.leave = function(user) {
  console.log('user leave:', user);
};
channel.publish('Hello World!');
channel.unsubscribe();
```
