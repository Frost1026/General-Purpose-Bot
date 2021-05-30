const fs = require("fs")
const discord = require("discord.js")
const option_file = "./components/configs/launch_options.json"

const template = {
	table: []
}

// JSON Buffer
var options = {}

// Functions to get declared, write here
const refreshJSONBuffer = (filepath) => {
	try {
		const data = fs.readFileSync(filepath)
		const object = JSON.parse(data)

		options = object
	} catch(err) {
		console.log(`Can't read ${filepath}`)
		console.log(`Writing template to ${filepath}`)
		fs.writeFileSync(filepath, JSON.stringify(template, null, 2))
		refreshJSONBuffer(filepath)
	}

	Object.freeze(options)
}

module.exports = {
	key: "launchoption",
	func: async (message, args, client, commands) => {
		refreshJSONBuffer(option_file)
		switch(args[0]) {
			case "set":
				let proceed
				let temp = {}

				const command = []

				temp["channelID"] = message.channel.id

				command.push(args.slice(1))
				command.push(temp)

				const optionsOld = JSON.parse(JSON.stringify(options, null, 2))

				if(commands.get(args[1])) {
					if(options.table.length) {
						proceed = !options.table.some((value, index) => {
							if(JSON.stringify(value.slice(0, -1)) === JSON.stringify(command.slice(0, -1))) {
								return true
							} else if(index === (options.table.length - 1)) {
								return false
							}
						})
					} else {
						proceed = true
					}

					if(proceed) {
						options.table.push(command)
						fs.writeFileSync(option_file, JSON.stringify(options, null, 2))
						refreshJSONBuffer(option_file)

						if(options.table.length > optionsOld.table.length) {
							message.channel.send(`Succesfully set <**${command[0].join(" ")}**> as a launch option`)
						}
					} else {
						message.channel.send(`${message.author} the launch option you tried to set is a **duplicate**.`)
					}
				} else {
					message.channel.send(`${message.author} so what command do you want to set to run on startup?`)
				}
				break;
			
			case "list":
				if(options.table.length > 0) {
					let payload
					let pages	
					let initialIndex = 0
				
					const pageLimit = 6
					const payloadBuffer = []

					const generateEmbed = (page) => {
						const payloadEmbed = new discord.MessageEmbed()

						pages = payloadBuffer.length

						payloadBuffer[page - 1].forEach((value, index) => {
							const channelName = client.channels.cache.get(options.table[payload.indexOf(value)][1].channelID).name
							payloadEmbed.addField(value, `To be run on startup from ${channelName}`)
						})

						payloadEmbed
							.setTitle("Launch Options")
							.setColor("#0074FF")
							.setFooter(`Page ${page} of ${pages}`)

						return payloadEmbed
					}

					payload = options.table.map((value) => {
						return value[0].join(" ")
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
					message.channel.send("No launch options to list, use <launchoption set> to set one")
				}
				break;

			case "delete":
				if(args[1]) {
					let exist
					let deletionIndex

					options.table.forEach((value, index) => {
						if(JSON.stringify(value[0]) === JSON.stringify(args.slice(1))) {
							exist = true
							deletionIndex = index
						} else if(index === (options.table.length - 1)) {
							message.channel.send(`**${args.slice(1).join(" ")}** was **not** set as a launch option`)
						}
					})

					if(options.table.length > 0 && exist) {
						let deletion

						const	confirmWords = ["delete launch options", "launch options delete", "launch options deletion", "confirm delete"]
						const deletionEmbed = new discord.MessageEmbed()
						const confirmationEmbed = new discord.MessageEmbed()
						const desciption = "Deleting said launch options means it is gone forever."

						const typeToConfirm = confirmWords[Math.floor(Math.random() * confirmWords.length)]

						deletionEmbed
							.setColor("#FF2D00")
							.setTitle(`Delete ${args.slice(1).join(" ")} from launch options`)
							.addField("Are you sure?", desciption, false)

						confirmationEmbed
							.setColor("#FF2D00")
							.setTitle("Confirm Total Deletion.")
							.addField("Type the following within 10s", typeToConfirm, false)

						message.channel.send(deletionEmbed).then((form) => {
							form.react('✅').then(() => {
								form.react('❌')
							})

							const filter = (reaction, user) => {
								return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id
							}

							const collector = form.createReactionCollector(filter, {
								time: 60000
							})

							collector.on("collect", (reaction) => {
								form.reactions.removeAll().then(async() => {
									if(reaction.emoji.name === '✅') {
										deletion = true
									} else if(reaction.emoji.name === '❌') {
										deletion = false
									} else {
										deletion = false
									}

									if(deletion) {
										const captchaFilter = (response) => {
											return response.content == typeToConfirm && response.author.id === message.author.id 
										}

										form.edit(confirmationEmbed)

										message.channel.awaitMessages(captchaFilter, {max: 1, time: 10000, errors: ["time"]}).then(() => {
											const optionsOld = JSON.parse(JSON.stringify(options, null, 2))

											form.delete()

											options.table.splice(deletionIndex, 1)
											fs.writeFileSync(option_file, JSON.stringify(options, null, 2))
											refreshJSONBuffer(option_file)

											if(options.table.length < optionsOld.table.length) {
												message.channel.send(`Succesfully **deleted** <**${args.slice(1).join(" ")}**> from launch options.`)
											} else {
												message.channel.send("A **problem occured**, please try again.")
											}
										}).catch(() => {
											message.channel.send("**Timed Out**")
											form.delete()
										})
									} else {
										message.channel.send("Deletion canceled")
										form.delete()
									}
								})
							})
						})
					}
				} else {
					message.channel.send("What launch option do you want to delete? Use command <**launchoption list**> to have a look.")
				}
				break;

			case "clear":
				if(options.table.length > 0) {
					let deletion

					const	confirmWords = ["delete launch options", "launch options delete", "launch options deletion", "confirm delete"]
					const deletionEmbed = new discord.MessageEmbed()
					const confirmationEmbed = new discord.MessageEmbed()
					const desciption = "Clearing launch options means a total deletion of existing launch options stored."

					const typeToConfirm = confirmWords[Math.floor(Math.random() * confirmWords.length)]

					deletionEmbed
						.setColor("#FF2D00")
						.setTitle("Clear Launch Options")
						.addField("Are you sure?", desciption, false)

					confirmationEmbed
						.setColor("#FF2D00")
						.setTitle("Confirm Total Deletion.")
						.addField("Type the following within 10s", typeToConfirm, false)

					message.channel.send(deletionEmbed).then((form) => {
						form.react('✅').then(() => {
							form.react('❌')
						})

						const filter = (reaction, user) => {
							return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id
						}

						const collector = form.createReactionCollector(filter, {
							time: 60000
						})

						collector.on("collect", (reaction) => {
							form.reactions.removeAll().then(async() => {
								if(reaction.emoji.name === '✅') {
									deletion = true
								} else if(reaction.emoji.name === '❌') {
									deletion = false
								} else {
									deletion = false
								}

								if(deletion) {
									const captchaFilter = (response) => {
										return response.content == typeToConfirm && response.author.id === message.author.id 
									}

									form.edit(confirmationEmbed)

									message.channel.awaitMessages(captchaFilter, {max: 1, time: 10000, errors: ["time"]}).then(() => {
										const optionsOld = JSON.parse(JSON.stringify(options, null, 2))

										form.delete()
										fs.writeFileSync(option_file, JSON.stringify(template, null, 2))
										refreshJSONBuffer(option_file)

										if(options.table.length < optionsOld.table.length) {
											message.channel.send("**Succesfully** cleared all launch options.")
										} else {
											message.channel.send("A **problem occured**, please try again.")
										}
									}).catch(() => {
										message.channel.send("**Timed Out**")
										form.delete()
									})
								} else {
									message.channel.send("Deletion canceled")
									form.delete()
								}
							})
						})
					})
				} else {
					message.channel.send("No launch options found, can't clear.")
				}
				break;

			default:
				message.channel.send(`${message.author} want action do you want to do? Actions available are: **<set> <delete> <clear>**.`)
				break;
		}
	}
}