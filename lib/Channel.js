var config          = require('../config.js');
var IdMap           = require('./IdMap');
var CircularArray   = require('./CircularArray');

/**
 *
 * @param any id
 */
function Channel(id)
{
  this.id = id;
  this.clients = new IdMap();
  this.publishes = new CircularArray( config.sendLastPublishesOnJoin );
}

Channel.prototype = 
{
  
  /**
   *
   */
  get size()
  {
    return this.clients.size;
  },
  
  /**
   *
   * @param string event
   * @param any message
   * @param string skip
   */
  emit: function(event, message, skip)
  {
    this.clients.each( skip, this, function(clientId, client) 
    {
      client.emit( event, message );
    });
  },
  
  /**
   * 
   * @param Client client
   * @param any token
   */
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
      
      this.publishes.forEach(function(data) 
      {
        client.emit( 'publish', data );
      });
    }
  },
  
  /**
   *
   * @param Client client
   * @param any token
   */
  leave: function(client, token)
  {
    if (this.clients.remove(client))
    {  
      this.emit( 'leave', {
        id: this.id,
        token: token
      });
      
      if (this.size === 0)
      {
        this.destroy();
      }
    }
  },
  
  /**
   *
   * @param Client client
   */
  has: function(client)
  {
    return this.clients.has( client );
  },
  
  /**
   * 
   * @param Client client
   * @param any message
   */
  publish: function(client, message)
  {
    this.emit( 'publish', message, config.echoPublish ? client.id : false );
    this.publishes.add( message );
  },
  
  /**
   * 
   */
  destroy: function() 
  {
    $channels.remove( this );
    
    if (config.debug)
    {
      console.log( 'Channel Destroyed', this.id );
    }
  }
};

/**
 *
 * @param any id
 * @param boolean create
 */
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

module.exports = Channel;