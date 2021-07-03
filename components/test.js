module.exports = {
	key: "test",
	func: async (message, args, client, commands) => {
		switch(args[0]) {
			case "member":
				console.log(message.guild.members.cache.get("491160146333007874").setNickname("Frosted"))
				break;

			case "guild":
				console.log(client.channels.cache.get("806836920826724353").guild.name)
				break;
			
			default:
				console.log("Testing Code")
				break;
		}
	}
}	