const { SlashCommandBuilder, userMention, ButtonBuilder, ButtonStyle, ActionRowBuilder} = require('discord.js');
const fs = require("fs").promises;
const axios = require('axios');

let cachedAppList = null;
let pageVal = 1;

let gameNames = [];
let gameHours = [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getuserlib')
        .setDescription('Returns a list containing the specified user\'s library')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to search')
                .setRequired(true)),
    async execute(interaction) {
        //reset all variables
        gameNames = [];
        gameHours = [];
        //cachedAppList = null;

        const next = new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next Page')
            .setStyle(ButtonStyle.Primary);
        const previous = new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('Previous Page')
            .setStyle(ButtonStyle.Primary);
        const row = new ActionRowBuilder()
            .addComponents(previous, next);

        try {
            const disID = interaction.options.get('user').value;
            const games2d = await searchIDs('steamIDs.json', disID);
            const response = await interaction.reply({
                    content: messageBuilder(pageVal, games2d),
                    components: [row]
            });

            const collectorFilter = (i) => i.user.id === interaction.user.id;

            // Wrap the interaction handling logic inside a loop
            while (true) {
                try {
                    // Wait for the user to press a button
                    const confirmation = await response.awaitMessageComponent({
                        filter: collectorFilter,
                        //time: 25_000, // Wait for 25 seconds
                    });

                    // Update the page value based on the button pressed
                    if (confirmation.customId === 'next') {
                        pageVal += 1;
                    } else if (confirmation.customId === 'prev') {
                        pageVal -= 1;
                    }

                    // Update the message with the new page value
                    await confirmation.update({
                        content: messageBuilder(pageVal, games2d),
                        components: [row],
                    });

                } catch (e) {
                    // Handle the error (timeout or other issues)
                    await interaction.editReply({
                        content: 'Confirmation not received within 1 minute, cancelling',
                        components: [],
                    });
                    break; // Exit the loop if no interaction is received within the time limit
                }
            }


        } catch (error) {
            console.error('Error executing command:', error);
            await interaction.reply("An error occurred while fetching the user's library.\n" +
                "Possible Error: The wrong steamID was set using `/syncsteam`.");
        }
    },
};

async function searchIDs(filePath, ID_dis) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const jsonData = JSON.parse(data);

        const index = jsonData.DiscordIDs.indexOf(ID_dis);

        if (index !== -1) {
            const ID_steam = jsonData.SteamIDs[index];
            const games = await getApiLib(ID_steam);
            return games;
        } else {
            return "User has not synchronized their Steam Account with Brerluh. To do so, please use /syncsteam\nIf you do not know how to get your Steam ID, just contact <@682602567464779791>";
        }
    } catch (err) {
        console.error('Error reading or parsing file:', err);
        throw err;
    }
}

async function getAppList() {
    if (cachedAppList) {
        return cachedAppList;
    }

    try {
        const response = await axios.get('https://api.steampowered.com/ISteamApps/GetAppList/v2/');
        cachedAppList = response.data.applist.apps;
        return cachedAppList;
    } catch (error) {
        console.error('Error fetching Steam App List: ', error);
        throw error;
    }
}

async function getApiLib(ID64) {
    try {
        const response = await axios.get(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=1CF43968254430BEA710733D0A6A3226&steamid=${ID64}&format=json`);
        const stJsonData = response.data;

        const games = stJsonData.response.games;

        if (!games || games.length === 0) {
            return "No games found for this user.";
        }

        const appids = games.map(game => game.appid);
        const hours = games.map(game => game.playtime_forever);

        const apps = await getAppList(); // GET ALL STEAM GAMES
        const fullIDs = apps.map(app => app.appid);
        const fullAppNames = apps.map(app => app.name);

        for (let i = 0; i < appids.length; i++) {
            const index_id = fullIDs.indexOf(appids[i]); //The index of the current game in the list of all steam games
            if (index_id !== -1) {
                gameNames.push(fullAppNames[index_id]);
            } else {
                gameNames.push("Game Not Found");
            }
            gameHours.push(Math.round((hours[i] * 10) / 60) / 10);
        }

        let combinedArray = gameHours.map((hours, index) => {
            return { hours: hours, name: gameNames[index] };
        });

        combinedArray.sort((a, b) => b.hours - a.hours);

        gameHours = combinedArray.map(game => game.hours);
        gameNames = combinedArray.map(game => game.name);

        let message = "";
        let maxLength = 0;
        for (let j = 0; j < gameNames.length; j++) {
            if (gameNames[j].length > maxLength) {
                maxLength = gameNames[j].length;
            }
        }
        //message += "GAME NAME" + " ".repeat(maxLength - "GAME NAME".length) + " : " + "PLAYTIME (hr)\n";
        for (let k = 0; k < gameNames.length; k++) {
            message += gameNames[k] + " ".repeat(maxLength - gameNames[k].length)
            message += " | " + gameHours[k];
            message += "\n";
        }
        return message + "";
    } catch (error) {
        console.error('Error fetching Steam API: ', error);
        throw error;
    }
}

function sanitizeString(str) {
    return str.replace(/[^\x20-\x7E]/g, ''); // Remove non-ASCII characters
}

function messageBuilder(page, msg) {
    //check max page number
    const is_remainder = (gameNames.length % 15 >= 1);
    const lines = msg.split("\n");
    const MAX_PAGE_NUM = Math.floor(lines.length / 15) + ((gameNames.length % 15 >= 1) ? 1 : 0);
    console.log("floor:", Math.floor(lines.length / 15));
    console.log(MAX_PAGE_NUM);
    console.log(lines.length);
    let updatedMessage = "```\n";
    //check if page is in that limit
    //if length of lines is less than or equal to 15, return all of them
    if (lines.length <= 15) {
        console.log("case 1");
        updatedMessage += "Page: 1/1 --- [GAME NAME : PLAYTIME]\n"
        for (let i = 0; i < lines.length; i++) {
            updatedMessage += lines[i];
            updatedMessage += "\n";
        }
        return updatedMessage + "```";
    }

    //if page is smaller than 1, return the first page
    if (page <= 1) {
        console.log("case 2");
        pageVal = 1;
        updatedMessage += "Page: 1/" + MAX_PAGE_NUM + " --- [GAME NAME : PLAYTIME]\n";
        for (let i = 0; i < 15; i++) {
            updatedMessage += lines[i];
            updatedMessage += "\n";
        }
        return updatedMessage + "```";
    }
    //if page is bigger than limit, return last page
    if (page >= MAX_PAGE_NUM) {
        console.log("case 3");
        pageVal = MAX_PAGE_NUM;
        updatedMessage += "Page: " + MAX_PAGE_NUM + "/" + MAX_PAGE_NUM + " --- [GAME NAME : PLAYTIME]\n";
        for (let i = 0; i < ((is_remainder === true) ? gameNames.length % 15 : 15); i++) {
            updatedMessage += lines[(pageVal - 1) * 15 + i];
            updatedMessage += "\n";
        }
        return updatedMessage + "```";
    }
    //use mod 15 to get that page info
    if (page > 1 && page < MAX_PAGE_NUM) {
        console.log("case 4");
        updatedMessage += "Page: " + page + "/" + MAX_PAGE_NUM + " --- [GAME NAME : PLAYTIME]\n";
        for (let i = 0; i < 15; i++) {
            updatedMessage += lines[((pageVal - 1) * 15) + i];
            updatedMessage += "\n";
        }
        return updatedMessage + "```";
    }


}