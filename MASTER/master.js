const express = require("express");
const socketClient = require("socket.io-client");

const Emitter = require('events');
const eventEmitter = new Emitter();

const selfServerId = 0;

var Token = 1;

var queue = [];

const app = express();
app.use(express.urlencoded({extended:true}))
app.use(express.json());
app.set('eventEmitter',eventEmitter);

const http = require('http').createServer(app)
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
  }
})

const server1 = socketClient("http://localhost:4000");
server1.emit("join",selfServerId);
const server2 = socketClient("http://localhost:5000");
server2.emit("join",selfServerId);
const server3 = socketClient("http://localhost:6000");
server3.emit("join",selfServerId);
const server4 = socketClient("http://localhost:7000");
server4.emit("join",selfServerId);

eventEmitter.on("token request from server event",(serverId)=>{
    console.log("request for token from server ",serverId)
    if(Token===1)
    {
        console.log("token given to server ",serverId);
        io.to(serverId).emit("TOKEN_REPLY");
        Token = 0;
    }
    else
    {
        queue.push(serverId);
    }
})

server1.on("TOKEN_REQUEST",(serverId)=>{
    eventEmitter.emit("token request from server event",serverId);
})

server2.on("TOKEN_REQUEST",(serverId)=>{
    eventEmitter.emit("token request from server event",serverId);
})

server3.on("TOKEN_REQUEST",(serverId)=>{
    eventEmitter.emit("token request from server event",serverId);
})

server4.on("TOKEN_REQUEST",(serverId)=>{
    eventEmitter.emit("token request from server event",serverId);
})


eventEmitter.on("token return from server event",(serverId)=>{
    console.log("server ",serverId," returned token");
    if(queue.length===0)
    {
        Token = 1;
    }    
    else
    {
        console.log("token given to server ",queue[0]);
        io.to(queue[0]).emit("TOKEN_REPLY");
        queue.shift();
    }
})

server1.on("TOKEN_RETURN",(serverId)=>{
    eventEmitter.emit("token return from server event",serverId);
})
  
server2.on("TOKEN_RETURN",(serverId)=>{
    eventEmitter.emit("token return from server event",serverId);
})
  
server3.on("TOKEN_RETURN",(serverId)=>{
    eventEmitter.emit("token return from server event",serverId);
})
  
server4.on("TOKEN_RETURN",(serverId)=>{
    eventEmitter.emit("token return from server event",serverId);
})


io.on('connection', socket => {
  socket.on('join', ( serverId ) => {
    socket.join(serverId);
    console.log('new socket connection with server ',serverId);
  })
});


http.listen(3000, function() {
  console.log('Food App System Master Listening On Port 3000');

});

