const { SlashCommandBuilder, userMention } = require('discord.js');
const fs = require("fs").promises; // Using the promise-based fs module

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vctimes')
        .setDescription('See the VC TIMES LEADERBOARD'),
    async execute(interaction) {
        let msg = await getListOfTimes();  // Await the result of getListOfTimes
        await interaction.reply(msg);
    },
};

async function getListOfTimes() {
    let finalMsg = "Name - - - - - : Time in VC - -";

    try {
        const data = await fs.readFile("C:\\Users\\talma\\PhpstormProjects\\BotForDuck\\vcTimes.json", 'utf8');  // Use the async version of readFile
        const jsonData = JSON.parse(data);

        // Iterate over the keys in the jsonData object
        for (let userId in jsonData) {
            if (jsonData.hasOwnProperty(userId)) {
                finalMsg += "\n";

                // Calculate the space to pad
                const padding = Math.max(15 - userId.length, 0); // Ensure padding is not negative

                // Append the user ID and time to the final message
                finalMsg += "<@" + userId + ">" + " ".repeat(padding) + ": " + (jsonData[userId] / 3600).toFixed(2) + " hours";  // Convert time to hours
            }
        }

        return finalMsg;  // Return the final message after processing
    } catch (err) {
        console.error('Error reading or parsing file:', err);
        return "Failed to retrieve data.";  // Return an error message if there's an issue
    }
}
