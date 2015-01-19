function PubSub(url) 
{
  this.socket = io(url);
  this.channels = {};
  this.socket.on('join', this.onJoin.bind(this));  
  this.socket.on('leave', this.onLeave.bind(this));
  this.socket.on('publish', this.onPublish.bind(this));
}

PubSub.prototype = 
{
  
  subscribe: function(id, metadata) 
  {
    this.socket.emit('subscribe', {
      id: id,
      payload: metadata
    });
    
    return (this.channels[id] = new PubSubChannel(id, metadata, this));
  },
  
  unsubscribe: function() 
  {
    for (var id in this.channels) {
      this.channels[id].unsubscribe();
    }
  },
  
  onJoin: function(msg) 
  {
    if (msg.id && msg.id in this.channels) {
      this.channels[msg.id].join(msg.payload);
    }
  },
  
  onLeave: function(msg) 
  {
    if (msg.id && msg.id in this.channels) {
      this.channels[msg.id].leave(msg.payload);
    }
  },
  
  onPublish: function(msg) 
  {
    if (msg.id && msg.id in this.channels) {
      this.channels[msg.id].receive(msg.payload);
    }
  }
};

function PubSubChannel(id, metadata, pubsub) 
{  
  this.id = id;
  this.metadata = metadata;
  this.pubsub = pubsub;
  this.join = function(data) {};
  this.leave = function(data) {};
  this.receive = function(data) {};
  this.subscribed = true;
}

PubSubChannel.prototype = 
{
  
  publish: function(data) 
  {
    if (this.subscribed) 
    {
      this.pubsub.socket.emit('publish', {
        id: this.id, 
        payload: data
      });
    }
  },
  
  unsubscribe: function() 
  {    
    this.subscribed = false;
    this.pubsub.socket.emit('unsubscribe', {
      id: this.id
    });
    
    delete this.pubsub.channels[this.id];
  }
};