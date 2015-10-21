var config  = require('../config');
var IdMap   = require('./IdMap');
var Channel = require('./Channel');
var Promise = require('./Promise');

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
    var factory = this;
    var promise = new Promise( this );

    var ch = this.channels.at( id );

    if ( ch )
    {
      promise.$success( [ch] );
    }
    else
    {
      config.validateId( id ).then(
        function onValid()
        {
          if (create)
          {
            factory.channels.add( ch = new Channel( id ) );
    
            if (config.debug)
            {
              console.log( 'Channel Created', id );
            }

            promise.$success( [ch] );
          }
          else
          {
            promise.$failure();
          }
        },
        function onInvalid()
        {
          promise.$failure();

          if (config.debug)
          {
            console.log( 'Invalid Channel ID', id );
          }
        }
      );
    }

    return promise;
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