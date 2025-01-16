const { SlashCommandBuilder } = require('discord.js');
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('syncsteam')
        .setDescription('Sync your Steam ID with your Discord username')
        .addStringOption(option =>
            option
                .setName('steamid')
                .setDescription('Your Steam ID')
                .setRequired(true)),
    async execute(interaction) {
        const givenID = interaction.options.get('steamid').value;
        addOrUpdateIDs("steamIDs.json", interaction.user.id.toString(), givenID);

        await interaction.reply({ content:  '<@' + interaction.user.id.toString() + '> Pong! ' + givenID});

    },
};
function addOrUpdateIDs(filePath, newDisID, newSteamID) {
    // Read the JSON file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        // Parse the JSON data
        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
            return;
        }

        // Find the index of the Discord ID if it exists
        const index = jsonData.DiscordIDs.indexOf(newDisID);

        if (index !== -1) {
            // If the Discord ID exists, update the associated Steam ID
            jsonData.SteamIDs[index] = newSteamID;
            console.log('Discord ID found. Updated associated Steam ID.');
        } else {
            // If the Discord ID does not exist, append the new values to the respective arrays
            jsonData.DiscordIDs.push(newDisID);
            jsonData.SteamIDs.push(newSteamID);
            console.log('New Discord ID added along with associated Steam ID.');
        }

        // Convert JSON data back to a string
        const updatedData = JSON.stringify(jsonData, null, 4);

        // Save the updated JSON data back to the file
        fs.writeFile(filePath, updatedData, 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error writing file:', writeErr);
                return;
            }

            console.log('IDs processed successfully.');
        });
    });
}