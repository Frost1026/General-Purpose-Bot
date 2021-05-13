//Set default timezone for node process
process.env.TZ = 'Asia/Kuala_Lumpur'

//Web Portion
const express = require('express')
require('console-stamp')(console, { 
    format: ':date(yyyy/mm/dd HH:MM:ss.l)',
})
const app = express()
const port = 3000

app.get('/', (req, res) => res.send("I'm not dead! :D"))

app.listen(port, () => console.log(`listening at http://localhost:${port}`))

//Discord Bot Portion
const config = require("./components/configs/config.json")

const discord = require("discord.js")
const fs = require("fs")

const client = new discord.Client()

const prefix = config.PREFIX
const commands = new Map()

const jsFiles = fs.readdirSync('./components').filter(file => file.endsWith('.js'))

jsFiles.forEach(commandFile => {
	const command = require(`./components/${commandFile}`)
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

    const preSlicedCommand = message.content.slice(prefix.length)
    const args = preSlicedCommand.split(" ")
    const command = args.shift().toLowerCase()

		console.log(`${message.author.username} ran the ${command} command`)

		if(commands.get(command) === undefined) {
			message.channel.send(`${command} command is not found`)
		} else if(message.author.bot) {
			return
		} else {
			if(!config.MAINTENANCE_MODE) {
				commands.get(command)(message, args)
			} else {
				message.channel.send(`${message.author} I am **under maintenance** only bot admins can use commands`)
			}
		}
  } catch(err) {
    console.log(err)
  }  
});
    
client.login(config.BOT_TOKEN);