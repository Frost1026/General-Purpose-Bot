const fs = require("fs")

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
		switch(args[0]) {
			case "set":
				if(args.length > 4) {
					if(validURL) {
						
					} else {
						message.channel.send("Link is invalid, please send again.")
					}
				} else {
					message.channel.send("Command format is invalid, try again with **!fr set <Target> <Object> <Link>**")
				}
				break;
		}
	}
}