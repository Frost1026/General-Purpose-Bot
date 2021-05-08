//Web Portion
const express = require('express');
const app = express();
const port = 8000;

app.get('/', (req, res) => res.send("I'm not dead! :D"));

app.listen(port, () => console.log(`listening at http://localhost:${port}`));

//Discord Bot Portion
const config = require("./config.json")

const discord = require("discord.js")
const fs = require("fs")

const client = new discord.Client()

const prefix = config.PREFIX
const commands = new Map()
const queue = new Map()

const jsFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

jsFiles.forEach(commandFile => {
	const command = require(`./commands/${commandFile}`)
	if(command.key && command.func) {
		commands.set(command.key, command.func)
	}
})

client.once('ready', () => {
	console.log('Ready!')
  console.log(`Logged in as ${client.user.tag}`)
});

client.on("message", async message => {
  try{
    if(!message.content.startsWith(prefix)) return

    const serverQueue = queue.get(message.guild.id);

    const preSlicedCommand = message.content.slice(prefix.length)
    const args = preSlicedCommand.split(" ")
    const command = args.shift().toLowerCase()

		if(commands.get(command) === undefined || message.author.bot) {
			return
		}

		commands.get(command)(message, args)
  } catch(err) {
    console.log(err)
  }  
});
    
client.login(config.BOT_TOKEN);