const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, ChannelType } = require('discord.js');
const { token } = require('./config.json');
const { guildId } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');

// Recursively read all files in the commands folder and subdirectories
const readCommandFiles = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            readCommandFiles(filePath);  // Recursively process subdirectories
        } else if (file.endsWith('.js')) {
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    });
};

readCommandFiles(foldersPath);  // Start reading the commands folder

// Read events files
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Looking for guild with Id: ${guildId}`);
    await trackVoiceChannelTimes();
});

client.login(token);

const VC_TIMES_PATH = path.join(__dirname, 'vcTimes.json');
    
// Function to load vcTimes from the JSON file
function loadVcTimes() {
    if (!fs.existsSync(VC_TIMES_PATH)) {
        saveVcTimes({}); // Create the file with an empty object
        return {}; // Return an empty object
    }

    const data = fs.readFileSync(VC_TIMES_PATH, 'utf8');

    if (data === "") { // Check for empty file
        return {};
    }

    return JSON.parse(data);
}

// Function to save vcTimes to the JSON file
function saveVcTimes(vcTimes) {
    fs.writeFileSync(VC_TIMES_PATH, JSON.stringify(vcTimes, null, 2));
}

// Sleep function for delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function trackVoiceChannelTimes() {
    while (true) {
        await sleep(3000); // Wait for 3 seconds

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.error("Guild not found. Check if the guildId is correct and the bot has joined this server.");
            return;
        }

        await guild.members.fetch(); // Ensure all members are cached

        // Load current times from JSON file
        const vcTimes = loadVcTimes();

        // Loop through all voice channels in the guild
        guild.channels.cache.filter(channel => channel.type === ChannelType.GuildVoice).forEach(channel => {
            channel.members.forEach(member => {
                const memberId = member.user.id;

                // Check if the user is already tracked, add them if not
                if (!vcTimes[memberId]) {
                    vcTimes[memberId] = 0; // Initialize with 0 if not present
                }

                // Increment the time spent in VC by 3 seconds
                vcTimes[memberId] += 3;
                console.log(`Updated time for ${member.user.username}: ${vcTimes[memberId]} seconds`);
            });
        });

        // Save updated times back to the JSON file
        saveVcTimes(vcTimes);

    }
}
