# Setting up Brerluh for Personal Use
To run this bot yourself, firstly create a discord developer account and create a bot. The steps for this are found [here](https://discord.com/developers/docs/quick-start/getting-started), but please beware that the method to create a discord bot has changed since this one was created, so after the first step, follow *this* guide.
When you have created your Bot's account, create a Node.Js project by following [this guide](https://discordjs.guide/preparations/#installing-node-js).
Alternatively, after you have downloaded Node.js, you may download this github repository.

Next, replace the `token` value in `config.json` with the token which you have gotten from your [Discord Developer Portal](https://discord.com/developers/applications). Additionally, replace the `guildID` in `config.json` with that of a server in which the bot should be present. Also replace any other values such as `clientID` and `musicChannelID` with those which correspond to your server.

Finally, run `index.js`, and the Bot will be online. You can run any of its commands by typing `/` in to the message bar in Discord and selecting the command you want to run.
