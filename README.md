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
