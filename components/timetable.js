const schedule = require("node-schedule")
const fs = require("fs")
const discord = require("discord.js")
const timetable_file = "./components/configs/timetable.json"

let jobs = []

const d = new Date()
const day = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

const template = {
	table: []
}

// JSON Buffer
var timetable = {}

// Functions to get declared, write here
const refreshJSONBuffer = (filepath) => {
	try {
		const data = fs.readFileSync(filepath)
		const object = JSON.parse(data)

		timetable = object
	} catch(err) {
		console.log(`Can't read ${filepath}`)
		console.log(`Writing template to ${filepath}`)
		fs.writeFileSync(filepath, JSON.stringify(template, null, 2))
		refreshJSONBuffer(filepath)
	}

	Object.freeze(timetable)
}

module.exports = {
	key: "ttb",
	func: async (message, args) => {
		refreshJSONBuffer(timetable_file)
		switch(args[0]) {
			case "set":
				if(args.length > 3 && day.includes(args[2].toLowerCase())) {
					let min = 0
					let hr = 8
					let proceed

					const container = {}
					const hour = []
					const minute = []
					const classes = args.slice(3, args.length)	

					const timetableOld = JSON.parse(JSON.stringify(timetable, null, 2))

					if(timetable.table.length) {
						proceed = !timetable.table.some((value, index) => {
							if(JSON.stringify(value.classes) === JSON.stringify(classes)) {
								return true
							} else if(index === (timetable.table.length - 1) && proceed === undefined) {
								return false
							}
						})
					} else {
						proceed = true
					}

					if(proceed) {
						classes.forEach((value, index) => {
							hour.push(hr)
							minute.push(min)

							if(value.toLowerCase() == "recess") {
								min += 30
							} else {
								min += 35
							}
							
							if(min > 59) {
								min -= 60
								hr += 1
							} else if (hr > 23) {
								console.log("Hour exceeded 24 hours")
							}
						})

						container.className = args[1]
						container.day = day.indexOf(args[2].toLowerCase())
						container.hour = hour
						container.minute = minute
						container.classes = classes

						timetable.table.push(container)

						fs.writeFileSync(timetable_file, JSON.stringify(timetable, null, 2))

						refreshJSONBuffer(timetable_file)

						if(timetable.table.length > timetableOld.table.length) {
							message.channel.send(`Succesfully set timetable alert for class **${container.className.toUpperCase()}** on **${day[container.day][0].toUpperCase().concat(day[container.day].slice(1))}**.`)
						}
					} else {
						message.channel.send(`${message.author} the timetable you tried to set are duplicates, please check again.`)
					}
				} else {
					message.channel.send(`${message.author} please enter a valid format.`)
				}
				break;

			case "on":
				jobs = []
				refreshJSONBuffer(timetable_file)
				timetable.table.forEach((object, classIndex) => {
					object.classes.forEach((value, index) => {
						const rule = new schedule.RecurrenceRule()
						rule.dayOfWeek = object.day
						rule.hour = object.hour[index]
						rule.minute = object.minute[index]

						const job = schedule.scheduleJob(rule, () => {
							const className = timetable.table[classIndex].className
							const classToHave = value
							let link = "No Link"
							switch(classToHave.toLowerCase()) {
								case "recess":
									message.channel.send(`${className.toUpperCase()} is now on **recess**`)
									break;

								case "-":
									message.channel.send(`Now ${className.toUpperCase()} have **no class**.`)
									break;

								default:
									message.channel.send(`${className.toUpperCase()} is now having **${classToHave.toUpperCase()}**. Link: ${link}`)
									break;
							}
						})

						jobs.push(job)
					})
				})
				break;

			case "delete":
				if(args[1]) {
					if(timetable.table.length > 0) {
						let index = 0

						timetable.table.forEach((value, index) => {
							const classTimetable = []
							const argsTimetable = []

							classTimetable.push(value.className)
							classTimetable.push(day[value.day])

							argsTimetable.push(args[1].toLowerCase())
							argsTimetable.push(args[2].toLowerCase())

							if(JSON.stringify(classTimetable) === JSON.stringify(argsTimetable)) {
								const timetableOld = JSON.parse(JSON.stringify(timetable, null, 2))

								timetable.table.splice(index, 1)
								fs.writeFileSync(timetable_file, JSON.stringify(timetable, null, 2))
								refreshJSONBuffer(timetable_file)

								if(timetable.table.length < timetableOld.table.length) {
									message.channel.send(`Succesfully deleted **${args.slice(2).join(" ").toUpperCase()}** from **${args[1].toUpperCase()}'s** timetable.`)
								} else {
									message.channel.send(`Could **not** delete said timetable, **contact Frost1026** if problem presist.`)
								}
							} else if(index === (timetable.table.length - 1)) {
								message.channel.send(`**${args[1].toUpperCase()}** have no timetable on **${args.slice(2).join(" ").toUpperCase()}**.`)
							}
						})
					} else {
						message.channel.send("Timetable file is **empty**, nothing to delete")
					}
				} else {
					message.channel.send("Please specify a day of a class's timetable to delete.")
				}
				break;

			case "clear":
				if(timetable.table.length > 0) {
					let deletion

					const	confirmWords = ["delete all timetable", "all timetable delete", "all timetable deletion", "confirm delete all timetable"]
					const deletionEmbed = new discord.MessageEmbed()
					const confirmationEmbed = new discord.MessageEmbed()
					const desciption = "Clearing timetable means a total deletion of existing timetables stored."

					const typeToConfirm = confirmWords[Math.floor(Math.random() * confirmWords.length)]

					deletionEmbed
						.setColor("#FF2D00")
						.setTitle("Clear Timetables")
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
										const timetableOld = JSON.parse(JSON.stringify(timetable, null, 2))

										form.delete()
										fs.writeFileSync(timetable_file, JSON.stringify(template, null, 2))
										refreshJSONBuffer(timetable_file)

										if(timetable.table.length < timetableOld.table.length) {
											message.channel.send("**Succesfully** cleared all timetables.")
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
					message.channel.send("No timetables found, can't clear.")
				}
				break;

			case "off":
				if(jobs.length > 0) {
					jobs.forEach((value) => {
						value.cancel()
					})
					message.channel.send("All on going timetables are canceled")
				} else {
					message.channel.send("No on going timetables to cancel, use <**ttb on**> to start one or <**ttb set**> to create one")
				}
				break;

			case "settings":
				
				break;

			default:
				message.channel.send("No arguments were given, available arguments are: <set>, <delete>, <list>, <on>, <off>")
				console.log("No arguments error")
				break;
		}
	}
}