//import { createClient } from 'redis';
import vers from 'redis';
const { createClient } = vers;
import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';

'use strict';
// SOCKETS
//const http = require('http');
// EXPRESS


const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["PUT", "GET", "POST", "DELETE", "OPTIONS"],
        credentials: false
      }
  });

 /* ////////////////////////////////////////////
  const newSocket = new Server(server, {
    cors: {
        origin: "*",
        methods: ["PUT", "GET", "POST", "DELETE", "OPTIONS"],
        credentials: false
      }
  });*/
/*const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["PUT", "GET", "POST", "DELETE", "OPTIONS"],
        credentials: false
      }
  });*/

// REDIS
function socketConnection(dates){
    //console.log(dates)
    io.on('connection', (socket)=>{
        //socket.emit('mensajes',{ver:"hola"});
        socket.emit('message',dates)
    });
}

// TIDIS
function socketRabbitMQ(dates){
    //console.log(dates)
    io.on('connection', (socket)=>{
        //socket.emit('mensajes',{ver:"hola"});
        socket.emit('message1',dates)
    });
}


// TIDIS
function socketAllPlayersT(dates){
    io.on('connection', (socket)=>{
        socket.emit('allPlayersT',dates)
    });
}

// REDDIS
function socketAllPlayersR(dates){
    io.on('connection', (socket)=>{
        socket.emit('allPlayersR',dates)
    });
}

// SOCKET PARA LOS 10 ULTIMOS JUEGOS REALIZDOS EN REDIS
function socketMostPlayedR(dates){
    //console.log(dates)
    io.on('connection', (socket)=>{
        socket.emit('lastRedis',dates/*{"games":dates}*/)
    });
}

// SOCKET PARA LOS 10 ULTIMOS JUEGOS REALIZDOS EN TIDIS
function socketMostPlayedT(dates){
    io.on('connection', (socket)=>{
        socket.emit('lastTidis',dates/*{"games":dates}*/)
    });
}


// SOCKET PARA LOS 10 MEJORES JUGADORES DE REDIS
function socketBestPlayersT(dates){
    //console.log("Estooo",dates)
    io.on('connection', (socket)=>{
        socket.emit('playersTidis',dates)
    });
}

// SOCKET PARA LOS 10 MEJORES JUGADORES DE TIDIS
function socketBestPlayersR(dates){
    io.on('connection', (socket)=>{
        socket.emit('playersRedis',dates)
    });
}



/*server.listen(8080, function(){
    ver();
    ver1();
});*/

var topTenGamesRedis = []
var playersRedis = []
var allPlayersT = []
var allPlayersR = []

// FUNCION PARA GUARDAR A LOS MEJORES JUGADORES
function addElement(array,element){
    let exist = false

    array.forEach(arrayElement=>{
        if(arrayElement.name == element){
            exist = true
        }
    })
    //console.log(exist)
    if (!exist){
        array.push({'name':element,'amount':1})
    }else{
        array.forEach(arrayElement => {
            if(arrayElement.name == element){
                arrayElement.amount ++ 
            }
        });
    }

    let len = array.length
    
    // ORDENO DE MAYOR A MENOR
    for (let i = 0; i < len; i++) {
        for (let j = 0; j < len; j++) {
            if(array[j+1]!=undefined){
                if (array[j].amount < array[j + 1].amount) {
                    let tmp = array[j];
                    array[j] = array[j + 1];
                    array[j + 1] = tmp;
                }
            }
        }
    }

    // OBTENGO LOS PRIMEROS 10
    while(array.length > 10){
        array.pop()
    }
}

//"type": "module",

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
} 

// REDIS 
const ver = async () => {
        while(true){
        const client = createClient({url:'redis://34.125.169.158:6379'});

        client.on('error', (err) => console.log('Redis Client Error', err));

        await client.connect();

        const value = await client.get('tiempoReal');
        //console.log(value)
        // ENVIO DE DATOS EN TIEMPO REAL
        socketConnection(value)

        // CONVIERTO EL STRING A JSON
        const  myJson = await JSON.parse(value)

        if(myJson != null){
            // GUARDO A LOS MEJORES JUGADORES
            addElement(playersRedis,myJson.winner)
            //GUARDO LOS ULTIMOS 10 JUEGOS
            topTenGamesRedis.unshift(myJson)
        }
        // ENVIO LOS MEJORES JUGADORES EN TIEMPO REAL
        socketBestPlayersR(playersRedis)
        // OBTENGO LOS ULTIMOS 10
        while(topTenGamesRedis.length > 10){
            topTenGamesRedis.pop()
        }
        //console.log(topTenGamesRedis)
        socketMostPlayedR(topTenGamesRedis);

        var allPlayersR = []
        if(myJson != undefined){
            for(let i=1; i<myJson.players+1; i++){
                allPlayersR.push({"name":"Jugador"+i,"state":"Jugador"+i==myJson.winner?"Ganador":"Perdedor","game":myJson.game_n})
            }
        }   
        // ENVIO AL SOCKET
        socketAllPlayersR(allPlayersR)
    }
};

// TIDIS
const ver1 = async () => {
        while (true){
        const client = createClient({url:'redis://34.125.187.155:5379'});

        client.on('error', (err) => console.log('Redis Client Error', err));

        await client.connect();

        const value = await client.get('tiempoReal');
        //console.log(value)
        // ENVIO DE DATOS EN TIEMPO REAL
        socketRabbitMQ(value)

        // CONVIERTO EL STRING A JSON
        const  myJson = await JSON.parse(value)

        if(myJson != null){
            // GUARDO A LOS MEJORES JUGADORES
            addElement(playersTidis,myJson.winner)
            //GUARDO LOS ULTIMOS 10 JUEGOS
            topTenGamesTidis.unshift(myJson)
        }
        // ENVIO LOS MEJORES JUGADORES EN TIEMPO REAL
        socketBestPlayersT(playersTidis)

        // OBTENGO LOS ULTIMOS 10
        while(topTenGamesTidis.length > 10){
            topTenGamesTidis.pop()
        }
        socketMostPlayedT(topTenGamesTidis);
        var allPlayersT = []

        if(myJson != undefined){
            for(let i=1; i<myJson.players+1; i++){
                allPlayersT.push({"name":"Jugador"+i,"state":"Jugador"+i==myJson.winner?"Ganador":"Perdedor","game":myJson.game_n})
            }
        }
        // ENVIO AL SOCKET
        socketAllPlayersT(allPlayersT)
    }
};

const aja = async() =>{
    console.log("mimir")
}

server.listen(8080, async function(){
    //setTimeout(ver1,1000)
    //setTimeout(ver,1000)
    // TIDIS
    const client = createClient({url:'redis://34.125.187.155:5379'});
    client.on('error', (err) => console.log('Redis Client Error', err));
    await client.connect();
    setInterval(() => tidis(client),3000)
    tidis(client)


    // REDIS
    const client2 = createClient({url:'redis://34.125.169.158:6379'});
    client.on('error', (err) => console.log('Redis Client Error', err));
    await client2.connect();
    setInterval(() => tidis(client2),3000)
    redis(client2)
    //ver();
    //ver1();
});


// TIDIS
const redis = async (client) => {
        const values = await client.lRange('listaJugadores', 0, -1)
        console.log(values)
            var topTenGamesRedis = []
            var playersRedis = []

            for(let i=0; i<values.length; i++){
            const myJson = await JSON.parse(values[i])

            if(myJson != null){
                // GUARDO A LOS MEJORES JUGADORES
                addElement(playersRedis,myJson.winner)
                //GUARDO LOS ULTIMOS 10 JUEGOS
                topTenGamesRedis.unshift(myJson)
            }

            // OBTENGO LOS ULTIMOS 10
            while(topTenGamesRedis.length > 10){
                topTenGamesRedis.pop()
            }
            var allPlayersR = []

            if(myJson != undefined){
                for(let i=1; i<myJson.players+1; i++){
                    allPlayersR.push({"name":"Jugador"+i,"state":"Jugador"+i==myJson.winner?"Ganador":"Perdedor","game":myJson.game_n})
                }
            }
            // ENVIO AL SOCKET
            socketBestPlayersR(playersRedis)
            socketMostPlayedR(topTenGamesRedis);
            socketAllPlayersR(allPlayersR)
    }
};





// TIDIS
const tidis = async (client) => {
    const values = await client.lRange('listaJugadores', 0, -1)
    console.log(values)
        var topTenGamesTidis = []
        var playersTidis = []

        for(let i=0; i<values.length; i++){
        const myJson = await JSON.parse(values[i])

        if(myJson != null){
            // GUARDO A LOS MEJORES JUGADORES
            addElement(playersTidis,myJson.winner)
            //GUARDO LOS ULTIMOS 10 JUEGOS
            topTenGamesTidis.unshift(myJson)
        }

        // OBTENGO LOS ULTIMOS 10
        while(topTenGamesTidis.length > 10){
            topTenGamesTidis.pop()
        }
        var allPlayersT = []

        if(myJson != undefined){
            for(let i=1; i<myJson.players+1; i++){
                allPlayersT.push({"name":"Jugador"+i,"state":"Jugador"+i==myJson.winner?"Ganador":"Perdedor","game":myJson.game_n})
            }
        }
        // ENVIO AL SOCKET
        socketBestPlayersT(playersTidis)
        socketMostPlayedT(topTenGamesTidis);
        socketAllPlayersT(allPlayersT)
}
};