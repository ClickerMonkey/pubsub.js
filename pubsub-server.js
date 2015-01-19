var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var config = require('./config');

function IdMap()
{
	this.size = 0;
	this.items = {};
}

IdMap.prototype = 
{
	add: function(item, itemToAdd)
	{
		var added = !(item.id in this.items);
		
		if (added)
		{
			this.items[ item.id ] = itemToAdd || item;
			this.size++;
		}
		
		return added;
	},
	at: function(id)
	{
		return this.items[ id ];
	},
	remove: function(item)
	{
		var removed = (item.id in this.items);
		
		if (removed)
		{
			delete this.items[ item.id ];
			this.size--;
		}
		
		return removed;
	},
	take: function(item)
	{
		var taken = this.items[ item.id ];
		this.remove( item );
		return taken;
	},
	has: function(item)
	{
		return ( item.id in this.items );
	},
	each: function(skipId, context, callback)
	{		
		for (var id in this.items)
		{
			if (id !== skipId)
			{
				callback.call( context, id, this.items[id] );
			}
		}
	}
};

/**
 * The map of Channels by their id.
 */
var $channels = new IdMap();

/**
 *
 */
function Channel(id)
{
	this.id = id;
	this.clients = new IdMap();
}

Channel.prototype = 
{
	
	emit: function(event, message, skip)
	{
		this.clients.each( skip, this, function(clientId, client) 
		{
			client.emit( event, message );
		});
	},
	
	join: function(client, token)
	{
		if (this.clients.add(client))
		{
			this.emit( 'join', {
				id: this.id,
				token: token
			}, client.id );
			
			if (config.sendExistingClientsOnJoin)
			{
				this.clients.each( client.id, this, function(clientId, otherClient)
				{
					client.emit( 'join', otherClient.tokens.at( this.id ) );
				});				
			}
		}
	},
	
	leave: function(client, token)
	{
		if (this.clients.remove(client))
		{	
			this.emit( 'leave', {
				id: this.id,
				token: token
			});
			
			if (this.clients.size === 0)
			{
				this.destroy();
			}
		}
	},
	has: function(client)
	{
		return this.clients.has( client );
	},
	publish: function(client, message)
	{
		this.emit( 'publish', message, config.echoPublish ? client.id : false );
	},
	destroy: function() 
	{
		$channels.remove( this );
		
		if (config.debug)
		{
			console.log( 'Channel Destroyed', this.id );
		}
	}
};

Channel.get = function(id, create)
{
	if (!config.validIds[ typeof id ])
	{
		if (config.debug)
		{
			console.log( 'Invalid Channel ID', id );
		}
		
		return false;
	}
	
	var ch = $channels.at( id );
	
	if (!ch && create)
	{
		$channels.add( ch = new Channel( id ) );
		
		if (config.debug)
		{
			console.log( 'Channel Created', id );
		}
	}
	
	return ch;
};

function Client(socket)
{
	this.socket = socket;
	this.tokens = new IdMap();
}

Client.prototype = 
{
	get id() 
	{
		return this.socket.id;
	},
	
	emit: function(event, message) 
	{
		this.socket.emit( event, message );
	},
	
	join: function(channel, token) 
	{
		if (this.tokens.add( channel, token ))
		{
			channel.join( this, token );
		}
	},
	
	leave: function(channel) 
	{
		if (this.tokens.has( channel ))
		{
			var token = this.tokens.take( channel );
			
			channel.leave( this, token );	
		}
	},
	
	subscribed: function(channel)
	{
		return this.tokens.has( channel );
	},
	
	destroy: function()
	{		
		this.tokens.each(null, this, function(channelId, token)
		{
			var channel = Channel.get( channelId, false );
			
			if (channel)
			{
				channel.leave( this, token );
			}
		});
	}
};

/**
 * Listen for new connections, and create a client when connected.
 */
io.on('connection', function(socket)
{
	var client = new Client( socket );
	
	if (config.debug)
	{
		console.log( 'Client Connected', socket.id );
	}
  
	/**
	 * Handle when the client tries to subscribe to a channel.
	 */
  socket.on('subscribe', function(msg) 
  {
		var token = msg.token;
		var channelId = msg.id;
		
		if (config.validTokens[ typeof token ] && config.validateToken( token )) 
		{
	    var channel = Channel.get( channelId, true );
			
			if (channel) 
			{
				client.join( channel, token );
				
				if (config.debug)
				{
					console.log( 'Client', socket.id, 'subscribed to channel', channelId, 'with token', token );
				}
			}
		}
		else if (config.debug)
		{
			console.log( 'Client', socket.id, 'sent invalid token', token );
		}
  });
  
	/**
	 * Handle when the client tries to unsubscribe from a channel.
	 */
  socket.on('unsubscribe', function(msg) 
  {
		var channelId = msg.id;
		var channel = Channel.get( channelId, false );
		
		var channelValid = !!channel;
		
		if (channel)
		{
			if (channel.has( client ) && client.subscribed( channel ))
			{
				client.leave( channel );
			
				if (config.debug)
				{
					console.log( 'Client', socket.id, 'unsubscribed from channel', channelId );
				}
			}
			else if (config.debug)
			{
				console.log( 'Client', socket.id, 'does not participate in the channel', channelId, 'so they cannot unsubscribe' );
			}
		}
		else if (config.debug)
		{
			console.log( 'Client', socket.id, 'cannot unsubscribe from the channel', channelId, ', it does not exist' );
		}
  });
  
	/**
	 * Handle when the client tries to publish to a channel.
	 */
  socket.on('publish', function(msg) 
  {
		var data = msg.data;
		var channelId = msg.id;
		var channel = Channel.get( channelId, false );
		
		if (channel)
		{
			// if you need to be subscribed to publish...
			if (!config.requireSubscription || client.subscribed( channel ))
			{
				// if it's a valid publish
				if (config.validPublish[typeof data] && config.validatePublish( data, client, channel ))
				{
					channel.publish( client, {
						id: channelId,
						data: data
					});
					
					if (config.debug)
					{
						console.log( 'Client', socket.id, 'published to channel', channelId, ':', data );
					}
				}
				else if (config.debug)
				{
					console.log( 'Client', socket.id, 'sent an invalid publish to channel', channelId, ':', data );
				}
			}
			else if (config.debug)
			{
				console.log( 'Client', socket.id, 'tried to publish to channel', channelId, 'but is not subscribed' );
			}
		}
		else if (config.debug)
		{
			console.log( 'Client', socket.id, 'tried to publish to channel', channelId, 'which does not exist' );
		}
  });
  
	/**
	 * Handle when a client disconnects from the server.
	 */
  socket.on('disconnect', function() 
  {
		client.destroy();
		
		if (config.debug)
		{
			console.log( 'Client Disconnected', socket.id );
		}
  });  
});

http.listen( config.port );