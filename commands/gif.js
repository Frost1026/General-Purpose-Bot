const fetch = require("node-fetch")

module.exports = {
	key: "gif",
	func: async (message, args) => {
		let gif_keyword = "Hello" //Current Default Search Term is Hello
		if(args.length) {
			gif_keyword = args.join(" ")
		}

		console.log(`Someone searched for ${gif_keyword} gifs`)
		const gif_url = `https://api.tenor.com/v1/search?q=${gif_keyword}&key=${process.env.TENOR_KEY}&contentfilter=high`

		const response = await fetch(gif_url)
		const json =  await response.json() //Big Data Sheet
		const index = await Math.floor(Math.random() * json.results.length) //Randomize the result\
		
		message.channel.send(json.results[index].url)  // Sends GIF    
		message.channel.send("GIF from Tenor: " + gif_keyword)
	}
}