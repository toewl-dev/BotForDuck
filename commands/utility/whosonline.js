const { SlashCommandBuilder, userMention } = require('discord.js');
const fs = require("fs").promises;
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whosonline')
        .setDescription('Who is currently playing which game?'),
    async execute(interaction) {
        let msg = await getPlayersOnline('steamIDs.json');
        await interaction.reply(msg);
    },
};

async function getPlayersOnline(filePath) {
    let usersIDs = [];
    let idStr = "";
    try {
        // Read JSON
        const data = await fs.readFile(filePath, 'utf-8');
        const jsonData = JSON.parse(data);

        for (let i = 0; i < jsonData.DiscordIDs.length; i++) {
            usersIDs.push(jsonData.SteamIDs[i]);
            idStr += jsonData.SteamIDs[i];
            idStr += (i === jsonData.DiscordIDs.length - 1) ? "" : ",";
        }

        //change to usernames and add InGame
        const response = await axios.get('http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=1CF43968254430BEA710733D0A6A3226&steamids=' + idStr);
        const stJsonData = response.data;
        const players = stJsonData.response.players;
        const userNames = players.map(user => user.personaname);
        let inGame = players.map(user => user.gameextrainfo);
        console.log(userNames);
        console.log(inGame);

        //change "undefined" to "No game"
        inGame = inGame.map(item => item === undefined ? "Not Playing any Game" : item);

        //make full string

        let message = "```";
        let maxLength = 0;
        for (let j = 0; j < userNames.length; j++) {
            if (userNames[j].length > maxLength) {
                maxLength = userNames[j].length;
            }
        }
        message += "NAME" + " ".repeat(maxLength - "NAME".length) + " : " + "GAME\n";
        for (let k = 0; k < userNames.length; k++) {
            message += userNames[k] + " ".repeat(maxLength - userNames[k].length)
            message += " : " + inGame[k];
            message += "\n";
        }
        return message + "```";

    } catch (err) {
        console.error('Error reading or parsing file:', err);
        throw err;
    }
}