//Web Portion
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send("I'm not dead! :D"));

app.listen(port, () => console.log(`listening at http://localhost:${port}`));

//Discord Bot Portion
const config = require("./config.json")

const discord = require("discord.js")
const fetch = require("node-fetch")
const ytdl = require('ytdl-core');

const client = new discord.Client()

const prefix = process.env.PREFIX
const queue = new Map();

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }
	
  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Started playing: **${song.title}**`);
}

client.once('ready', () => {
	console.log('Ready!')
  console.log(`Logged in as ${client.user.tag}`)
});

client.on("message", async message => {
  try{
    if(message.author.bot) return
    if(!message.content.startsWith(prefix)) return

    const serverQueue = queue.get(message.guild.id);

    const preSlicedCommand = message.content.slice(prefix.length)
    const args = preSlicedCommand.split(" ")
    const command = args.shift().toLowerCase()

    switch(command) {
      case "ping":
        const timeTaken = Date.now() - message.createdTimestamp;
        message.reply(`Pong! This message had a latency of ${timeTaken}ms.`)
        break;
      
      case "yell":
        message.author.send(``)
        break;

      case "gif":
        let gif_keyword = "Hello" //Current Default Search Term is Hello
        if(args.length) {
          gif_keyword = args.join(" ")
        }

        console.log(`Someone searched for ${gif_keyword} gifs`)
        const gif_url = `https://api.tenor.com/v1/search?q=${gif_keyword}&key=${config.TENOR_KEY}&contentfilter=high`

        const response = await fetch(gif_url)
        const json =  await response.json() //Big Data Sheet
        const index = await Math.floor(Math.random() * json.results.length) //Randomize the result\
        
        message.channel.send(json.results[index].url)  // Sends GIF    
        message.channel.send("GIF from Tenor: " + gif_keyword) 
        break;

      case "play":
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel)
          return message.channel.send(
            "You need to be in a voice channel to play music!"
          );
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
          return message.channel.send(
            "I need the permissions to join and speak in your voice channel!"
          );
        }

        const songInfo = await ytdl.getInfo(args.join(" "));
        const song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
        };

        if (!serverQueue) {
          // Creating the contract for our queue
          const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
          };
          // Setting the queue using our contract
          queue.set(message.guild.id, queueContruct);
          // Pushing the song to our songs array
          queueContruct.songs.push(song);

          try {
            // Here we try to join the voicechat and save our connection into our object.
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            // Calling the play function to start a song
            play(message.guild, queueContruct.songs[0]);
          } catch (err) {
            // Printing the error message if the bot fails to join the voicechat
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
          }
        } else {
          serverQueue.songs.push(song);
          console.log(serverQueue.songs);
          return message.channel.send(`${song.title} has been added to the queue!`);
        }
        break;

      case "skip":
        if(!message.member.voice.channel) {
          return message.channel.send(
            "You have to be in a voice channel to skip the music!"
          );
        }
        if(!serverQueue) {
          return message.channel.send(
            "There is no song that I could skip!"
          );
        }
        serverQueue.connection.dispatcher.end();
        break;     

      case "stop":
        if(!message.member.voice.channel) {
          return message.channel.send(
            "You have to be in a voice channel to stop the music!"
          );
        }
        if(!serverQueue) {
          return message.channel.send("There is no song that I could stop!");
        }
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
        break; 
      
      case "queue":

        break;

      default:
        message.channel.send("You need to enter a valid command!");
        break;
    }
  } catch(err) {
    console.log(err)
  }  
});
    
client.login(config.BOT_TOKEN);