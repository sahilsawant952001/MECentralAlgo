const express = require("express");
const socketClient = require("socket.io-client");
const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/foodAppDB",{useNewUrlParser:true ,useUnifiedTopology:true});

const mealsSchema = {
  _id:Number,
  name:String,
  quantity:Number,
  price:Number
}

const Meals = mongoose.model("meals",mealsSchema);

const accountSchema = {
  _id:String,
  amount:Number,
  orderCount:Number
}

const Account = mongoose.model("accounts",accountSchema);

const Emitter = require('events');
const eventEmitter = new Emitter();

const masterId = 0;
const selfServerId = 2;

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

const Master = socketClient("http://localhost:3000");
Master.emit("join",selfServerId);

var mealsPrice = [-1,50,60,70];

eventEmitter.on("acquire critical section",() => {
 
  console.log("Server ",selfServerId," Inside Of Critical Section!")

  setTimeout(() => {
    var mealId = parseInt(process.argv[3]);
    var orderQuantity = parseInt(process.argv[4]);

    Meals.findOne({_id:mealId},(err1,result1) => {
      if(err1)
      {
        console.log("some error occured")
      }
      else
      {
        if(result1.quantity>=orderQuantity)
        {
          Account.findById({_id:"root"},(err2,result2)=>{
            if(err2)
            {
              console.log("some error occured")
            }
            else
            {
              Account.updateOne({_id:"root"},{amount:result2.amount + (mealsPrice[mealId]*orderQuantity),orderCount:result2.orderCount+1},(err3,result3)=>{
                if(err3)
                {
                  console.log("some error occured");
                }
                else
                {
                  Meals.updateOne({_id:mealId},{quantity:result1.quantity-orderQuantity},(err4,result4)=>{
                    if(err4)
                    {
                      console.log("some error occured");
                    }
                    else
                    {
                      console.log("order successfull!")
                    }
                  })
                }
              })
            }
          })
        }
        else
        {
          console.log("order quantity beyond capacity");
        }
      }
    })
    console.log("Server ",selfServerId," Outside Of Critical Section!")
    io.to(masterId).emit("TOKEN_RETURN",selfServerId);
  }, 10000);
})


Master.on("TOKEN_REPLY",()=>{
    eventEmitter.emit("acquire critical section");
})

io.on('connection', socket => {
  socket.on('join', ( serverId ) => {
    socket.join(serverId);
    console.log('new socket connection with server ',serverId);
  })
});


http.listen(5000, function() {
  console.log('Food App Server ',selfServerId,' Listening On Port 5000');
  setTimeout(() => {
    if(parseInt(process.argv[2])===1)
    {
      io.to(masterId).emit("TOKEN_REQUEST",selfServerId)
    }
  }, 5000);
});

