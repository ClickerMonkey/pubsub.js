var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket)
{    
  var subscriptions = {};
  
  socket.on('subscribe', function(msg) 
  {
    if (msg.id) 
    {
      if (!(msg.id in subscriptions)) 
      {
        socket.in(msg.id).emit('join', msg);
        socket.join(msg.id); 
      }
      
      subscriptions[msg.id] = msg;
    }
  });
  
  socket.on('unsubscribe', function(msg) 
  {
    if (msg.id && msg.id in subscriptions) 
    {
      socket.in(msg.id).emit('leave', subscriptions[msg.id]);
      socket.leave(msg.id);
      delete subscriptions[msg.id];
    }
  });
  
  socket.on('publish', function(msg) 
  {
    if (msg.id) 
    {
      socket.in(msg.id).emit('publish', msg); 
    }
  });
  
  socket.on('disconnect', function() 
  {
    for (var id in subscriptions) 
    {
      var msg = subscriptions[id];
      socket.to(msg.id).emit('leave', msg);      
    }
  });
  
});

http.listen(3000);