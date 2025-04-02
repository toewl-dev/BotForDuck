const { SlashCommandBuilder } = require('discord.js');
const fs = require("fs").promises; // Using the promise-based fs module

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vctimes')
        .setDescription('See the VC TIMES LEADERBOARD'),
    async execute(interaction) {
        let msg = await getListOfTimes(interaction.client);  // Pass the client to getListOfTimes
        await interaction.reply("```" + msg + "```");
    },
};

async function getListOfTimes(client) {
    let finalMsg = "Name            : Time in VC (hours)";
    try {
        const data = await fs.readFile("C:\\Users\\talma\\PhpstormProjects\\BotForDuck\\vcTimes.json", 'utf8');
        const jsonData = JSON.parse(data);

        // Create an array of user objects with userId and time
        let userList = [];
        for (let userId in jsonData) {
            if (jsonData.hasOwnProperty(userId)) {
                let userName = "Unknown User"; // Default name if fetching fails
                try {
                    const user = await client.users.fetch(userId); // Fetch user details from Discord
                    userName = user.username;
                } catch (err) {
                    console.warn(`Failed to fetch user for ID ${userId}:`, err);
                }

                // Store user data with their time in VC
                userList.push({
                    userName: userName,
                    timeInSeconds: jsonData[userId]
                });
            }
        }

        // Sort users by time spent in VC using a custom bubble sort
        bubbleSort(userList);

        // Add sorted data to the final message
        userList.forEach(user => {
            const paddedName = user.userName.padEnd(15, ' '); // Ensure usernames are aligned
            const timeInHours = (user.timeInSeconds / 3600).toFixed(2); // Convert time to hours
            finalMsg += `\n${paddedName} : ${timeInHours}`;
        });

        return finalMsg;
    } catch (err) {
        console.error('Error reading or parsing file:', err);
        return "Failed to retrieve data.";
    }
}

function bubbleSort(arr) {
    let n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j].timeInSeconds < arr[j + 1].timeInSeconds) {
                // Swap elements
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    console.log(arr);
}
