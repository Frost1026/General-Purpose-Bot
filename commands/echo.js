module.exports = {
	key: "echo",
	func: async (message, args) => {
		if(args) {
			message.delete()
			message.channel.send(args.join())
		}
	}
}