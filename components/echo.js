module.exports = {
	key: "echo",
	func: async (message, args) => {
		if(args) {
			try {
				message.delete()
				message.channel.send(args.join(" "))
			} catch {
				console.log("Not able to delete echo command, is it ran as launch option?")
				message.channel.send(args.join(" "))
			}
		}
	}
}