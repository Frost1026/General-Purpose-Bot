const schedule = require("node-schedule")
const fs = require("fs")
const timetable_file = "./components/configs/timetable.json"

const d = new Date()
const day = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday"]

const template = {
	table: []
}

// Buffer for timetable.json
var timetable = {
	table: []
}

// Functions to get declared, write here
const refreshJSONBuffer = (filepath) => {
	try {
		const data = fs.readFileSync(filepath)
		const object = JSON.parse(data)

		timetable = object
	} catch {
		console.log(`Can't read ${filepath}`)
		console.log(`Writing template to ${filepath}`)
		fs.writeFileSync(timetable_file, JSON.stringify(template, null, 2))
		refreshJSONBuffer(filepath)
	}

	Object.freeze(timetable)
}

module.exports = {
	key: "ttb",
	func: async (message, args) => {
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

					refreshJSONBuffer(timetable_file)

					for(const index in timetable.table) {
						if(JSON.stringify(timetable.table[index].classes) === JSON.stringify(classes)) {
							proceed = false
						} else {
							proceed = true
						}
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
						container.day = day.indexOf(args[2])
						container.hour = hour
						container.minute = minute
						container.classes = classes

						timetable.table.push(container)

						fs.writeFileSync(timetable_file, JSON.stringify(timetable, null, 2))

						refreshJSONBuffer(timetable_file)
					} else {
						message.channel.send(`${message.author} the timetable you tried to set are duplicates, please check again.`)
					}
				} else {
					message.channel.send(`${message.author} please enter a valid format.`)
				}
				break;

			case "on":
				
				break;

			case "off":
				
				break;

			case "settings":

				break;

			default:
				message.channel.send("No arguments were given, available arguments are: <set> , <on> , <off>")
				console.log("No arguments error")
				break;
		}
	}
}