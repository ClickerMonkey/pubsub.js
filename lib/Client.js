var IdMap    = require('./IdMap');
var Channel  = require('./Channel');

/**
 *
 * @param socket.io socket
 */
function Client(socket)
{
  this.socket = socket;
  this.tokens = new IdMap();
}

Client.prototype = 
{
  
  /**
   *
   */
  get id() 
  {
    return this.socket.id;
  },
  
  /**
   *
   * @param string event
   * @param any message
   */
  emit: function(event, message) 
  {
    this.socket.emit( event, message );
  },
  
  /**
   *
   * @param Channel channel
   * @param any token
   */
  join: function(channel, token) 
  {
    if (this.tokens.add( channel, token ))
    {
      channel.join( this, token );
    }
  },
  
  /**
   *
   * @param Channel channel
   */
  leave: function(channel) 
  {
    if (this.tokens.has( channel ))
    {
      var token = this.tokens.take( channel );
      
      channel.leave( this, token );  
    }
  },
  
  /**
   *
   * @param Channel channel
   */
  subscribed: function(channel)
  {
    return this.tokens.has( channel );
  },
  
  /**
   *
   */
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

module.exports = Client;