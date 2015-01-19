/**
 * Establishes a connection to the given HTTP URL to enable subscribing and publishing to channels.
 * 
 * @param string url
 */
function PubSub(url)
{
  this.socket = io(url);
  this.channels = {};
  this.socket.on('join', this.onMessage('onjoin', 'token'));
  this.socket.on('leave', this.onMessage('onleave', 'token'));
  this.socket.on('publish', this.onMessage('onpublish', 'data'));
}

PubSub.prototype = 
{
  
  /**
   * Subscribe to the channel with the given ID while optionally sending over a token
   * which represents my subscription to the channel. This token can be sent to all
   * current and future subscribers to the channel as long as you're subscribed.
   *
   * @param any id
   * @param any token
   */
  subscribe: function(id, token) 
  {
    this.socket.emit('subscribe', {
      id: id,
      token: token
    });
    
    return (this.channels[id] = new PubSubChannel(id, token, this));
  },
  
  /**
   * Unsubscribes from all channels.
   */
  unsubscribe: function() 
  {
    for (var channelId in this.channels) 
    {
      this.channels[channelId].unsubscribe();
      delete this.channels[channelId];
    }
  },
  
  /**
   * Returns a function that listens for message emissions 
   * and notifies the proper channel with the correct data.
   *
   * @param string listener
   *     The function on the channel to invoke on emission.
   * @param string property
   *     The property on the received message to send to the channel's listening function.
   */
  onMessage: function(listener, property)
  {
    var pubsub = this;
    
    return function(msg) 
    {
      if (msg.id && msg.id in pubsub.channels) 
      {
        var channel = pubsub.channels[msg.id];
        var callback = channel[listener];
        
        if (typeof callback === 'function')
        {
          callback.call(channel, msg[property]);
        }
      }
    };
  }
	
};

/**
 *
 * @param any id
 * @param any token
 * @param PubSub pubsub
 */
function PubSubChannel(id, token, pubsub) 
{  
  this.id = id;
  this.token = token;
  this.pubsub = pubsub;
  this.onjoin = function(data) {};
  this.onleave = function(data) {};
  this.onpublish = function(data) {};
  this.subscribed = true;
}

PubSubChannel.prototype = 
{
   
  /**
   *
   * @param any data
   */
  publish: function(data) 
  {
    if (this.subscribed) 
    {
      this.pubsub.socket.emit('publish', {
        id: this.id, 
        data: data
      });
    }
  },
  
  /**
   * 
   */
  unsubscribe: function() 
  {    
    this.subscribed = false;
    this.pubsub.socket.emit('unsubscribe', {
      id: this.id
    });
    
    delete this.pubsub.channels[this.id];
  }
	
};