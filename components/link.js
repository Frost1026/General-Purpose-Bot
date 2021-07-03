const discord = require("discord.js")
const fs = require("fs")

const template = {
	table: []
}

const links_file = "./components/configs/links.json"

var links = {}

const refreshJSONBuffer = (filepath, obj) => {
	try {
		const data = fs.readFileSync(filepath)
		const temp = JSON.parse(data)
		const keys = Object.keys(temp)

		keys.some((value) => {
			obj[value] = temp[value]
		})
	} catch {
		console.log(`Can't read ${filepath}`)
		console.log(`Writing template to ${filepath}`)
		fs.writeFileSync(filepath, JSON.stringify(template, null, 2))
		refreshJSONBuffer(filepath, obj)
	}

	Object.freeze(obj)
}

const validURL = (str) => {
  const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator

  return pattern.test(str);
}

module.exports = {
	key: "link",
	func: async (message, args) => {
		refreshJSONBuffer(links_file, links)
		switch(args[0]) {
			case "set":
				if(args.length > 3) {
					if(validURL(args.slice(-1))) {
						let proceed

						if(links.table.length) {
								proceed = !links.table.some((value, index) => {
								if(value.target === args[1] && value.object === args[2]) {
									return true
								} else if(index === (links.table.length - 1) && proceed === undefined) {
									return false
								}
							})
						} else {
							proceed = true
						}

						if(proceed) {
							const container = {}
							const oldLinks = JSON.parse(JSON.stringify(links, null, 2))

							container.target = args[1].toLowerCase()
							container.object = args[2]
							container.link = args[3]

							links.table.push(container)

							fs.writeFileSync(links_file, JSON.stringify(links, null, 2))

							refreshJSONBuffer(links_file, links)

							if(links.table.length > oldLinks.table.length) {
								message.channel.send(`Succesfully set link of **${args[1].toUpperCase()}** for **${args[2].toUpperCase()}**`)
							}
						} else {
							message.channel.send(`${message.author} the link you tried to set was already saved, please check again.`)
						}
					} else {
						message.channel.send("Link is invalid, please send again.")
					}
				} else {
					message.channel.send("Command format is invalid, try again with **!fr link set <Target> <Object> <Link>**")
				}
				break;

			case "list":
				if(links.table.length > 0) {
					let payload
					let pages	
					let initialIndex = 0
				
					const pageLimit = 6
					const payloadBuffer = []

					const generateEmbed = (page) => {
						let link
						const payloadEmbed = new discord.MessageEmbed()

						pages = payloadBuffer.length

						payloadBuffer[page - 1].forEach((value, index) => {
							link = links.table[index].link
							payloadEmbed.addField(value, `<${link}>`)
						})

						payloadEmbed
							.setTitle("Saved Links")
							.setColor("#0074FF")
							.setFooter(`Page ${page} of ${pages}`)

						return payloadEmbed
					}

					payload = links.table.map((value) => {
						return `${value.target.toUpperCase()} -- ${value.object.toUpperCase()}`
					})

					for(var [index, value] of payload.entries()) {
						index += 1
						if((index % pageLimit) === 0) {
							payloadBuffer.push(payload.slice(initialIndex, index))
							initialIndex += pageLimit
						} else if(index === payload.length) {
							payloadBuffer.push(payload.slice(initialIndex, index))
						}
					}

					message.channel.send(generateEmbed(1)).then((list) => {
						let currentPage = 1

						if(pages > 1) {
							list.react("➡️")

							const filter = (reaction, user) => {
								return ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === message.author.id
							}

							const collector = list.createReactionCollector(filter, {
								time: 60000
							})

							collector.on("collect", (reaction) => {
								list.reactions.removeAll().then(async() => {
									if(reaction.emoji.name === '➡️') {
										currentPage += 1
									} else if(reaction.emoji.name === '⬅️') {
										currentPage -= 1
									}

									list.edit(generateEmbed(currentPage))

									if(currentPage > 1) {
										await list.react('⬅️')
									}

									if(currentPage < pages) {
										list.react('➡️')
									}
								})
							})

							collector.on("end", collected => {
								list.reactions.removeAll().then(async() => {
									list.delete()
								})
							})
						}
					})
				} else {
					message.channel.send("No saved links to list, use **<link set [target] [object] [link]>** to set one")
				}
				break;
			
			default:
				message.channel.send("No arguments were given, available arguments are: <set>, <list>, <delete>, <clear>")
				console.log("No arguments error")
				break;
		}
	}
}