var app      = require('express')();
var http     = require('http').Server(app);
var io       = require('socket.io')(http);

var config   = require('./config');
var IdMap    = require('./lib/IdMap');
var Channel  = require('./lib/Channel');
var Client   = require('./lib/Client');

global.$channels = new IdMap();

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