var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var config = require('./config');

/**
 * The map of Channels by their id.
 */
var channels = {};

function Channel(id)
{
	this.id = id;
	this.size = 0;
	this.clients = {};
}

Channel.prototype = 
{
	emit: function(event, message, skip)
	{
		for (var clientId in this.clients)
		{
			if (clientId === skip)
			{
				continue;
			}
			
			this.clients[clientId].emit(event, message);
		}
	},
	join: function(client, message)
	{
		if (!(client.id in this.clients))
		{
			this.emit('join',  message);	
			
			if (config.sendExistingClientsOnJoin)
			{
				for (var clientId in this.clients)
				{
					client.emit('join', this.clients[clientId].tokens[this.id]);
				}
			}
			
			this.clients[client.id] = client;
			this.size++;
		}		
	},
	leave: function(client, message)
	{
		if (client.id in this.clients)
		{
			delete this.clients[client.id];
			this.emit('leave', message);
			this.size--;
			
			if (this.size === 0)
			{
				this.destroy();
			}
		}
	},
	has: function(client)
	{
		return client.id in this.clients;
	},
	publish: function(client, message)
	{
		this.emit('publish', message, config.echoPublish ? client.id : false);
	},
	create: function()
	{
		channels[this.id] = this;
	},
	destroy: function() 
	{
		delete channels[this.id];
	}
};

Channel.get = function(id, create)
{	
	if (!config.validIds[typeof id])
	{
		return false;
	}
	
	var ch = channels[id];
	
	if (id && !ch && create)
	{
		ch = channels[id] = new Channel(id);
	}
	
	return ch;
};

function Client(socket)
{
	this.socket = socket;
	this.tokens = {};
}

Client.prototype = 
{
	get id() 
	{
		return this.socket.id;
	},
	emit: function(event, message) 
	{
		this.socket.emit(event, message);
	},
	join: function(channel, token) 
	{
		channel.join(this, token);
		this.tokens[channel.id] = token;
	},
	leave: function(channel) 
	{
		var token = this.tokens[channel.id];
		channel.leave(this, token);
		delete this.tokens[channel.id];
	},
	destroy: function()
	{
		for (var channelId in this.tokens)
		{
			var token = this.tokens[channelId];
			var ch = Channel.get(msg.id, false);
			if (ch) ch.leave(this, token);
			delete this.tokens[channelId];
		}
	}
};

io.on('connection', function(socket)
{
	var client = new Client(socket);
  
  socket.on('subscribe', function(msg) 
  {
    var ch = Channel.get(msg.id, true);
		if (ch) client.join(ch, msg);
  });
  
  socket.on('unsubscribe', function(msg) 
  {
		var ch = Channel.get(msg.id, false);
		if (ch && ch.has(client)) client.leave(ch);
  });
  
  socket.on('publish', function(msg) 
  {
		var ch = Channel.get(msg.id, false);
		if (ch) ch.publish(client, msg);
  });
  
  socket.on('disconnect', function() 
  {
		client.destroy();
  });  
});

http.listen( config.port );