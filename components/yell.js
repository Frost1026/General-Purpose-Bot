module.exports = {
	key: "yell",
	func: async (message, args) => {
		message.author.send(args)
	}
}