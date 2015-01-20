var config  = require('../config');
var IdMap   = require('./IdMap');
var Channel = require('./Channel');

/**
 * Instantiates a new ChannelRegistry.
 */
function ChannelFactory()
{
  this.channels = new IdMap();
}

ChannelFactory.prototype = 
{

  /**
   * The factory method which returns a Channel given an ID. If the Channel 
   * doesn't exist, the ID is valid, and create is true this will create
   * and return a new Channel.
   *
   * @param any id
   *   The ID of the channel to return.
   * @param boolean create
   *   Whether to create the requested Channel if it doesn't exist.
   * @return The Channel or a value equivalent to false if no Channel exists.
   */
  get: function(id, create)
  {
    var ch = this.channels.at( id );
    
    if (!ch)
    {
      if (!config.validIds[ typeof id ] || !config.validateId(id))
      {
        if (config.debug)
        {
          console.log( 'Invalid Channel ID', id );
        }
    
        return false;
      }
    
      if (create)
      {
        this.channels.add( ch = new Channel( id ) );
    
        if (config.debug)
        {
          console.log( 'Channel Created', id );
        }
      }
    }
  
    return ch;
  },
  
  /**
   * Removes the channel from the ChannelRegistry. This typically happens when 
   * the Channel has no subscribers left.
   */
  remove: function(channel)
  {
    if (this.channels.remove( channel ))
    {
      if (config.debug)
      {
        console.log( 'Channel Destroyed', this.id );
      }  
    }    
  }
  
};

// Export a single instange of the ChannelFactory
module.exports = new ChannelFactory();