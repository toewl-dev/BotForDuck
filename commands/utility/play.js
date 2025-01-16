const { SlashCommandBuilder } = require('discord.js');
const { generateDependancyReport, AudioPlayerStatus, joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const config =  require('C:\\Users\\talma\\PhpstormProjects\\BotForDuck\\config.json');
const { spawn } = require('child_process');
const vidLink = require('C:\\Users\\talma\\PhpstormProjects\\BotForDuck\\mp3downloads\\vidLink.json');
const fs = require('fs');
const getMP3Duration = require('get-mp3-duration');
const axios = require("axios");
const path = require("path");
/*
const buffer = fs.readFileSync('C:\\Users\\talma\\Downloads\\faded.mp3');
const duration = getMP3Duration(buffer);
 */

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays Music.')
        .addAttachmentOption(option =>
            option
                .setName('file')
                .setDescription('link to play')
                .setRequired(false)),
    async execute(interaction) {
        //getLinkmp3(interaction.options.link);
        const attachment = interaction.options.getAttachment('file');
        console.log(attachment.url);
        if (!attachment) {
            await interaction.reply({ content: 'Please provide a valid MP3 file.', ephemeral: false });
            return;
        }

        const fileName = attachment.name.toLowerCase();
        const isMp3 = fileName.endsWith('.mp3') || (attachment.contentType && attachment.contentType === 'audio/mpeg');

        if (!isMp3) {
            await interaction.reply({ content: 'Please provide a valid MP3 file.', ephemeral: true });
            return;
        }

        console.log("File downloaded (i hope)")
        const guildId = config.guildId;
        const voiceChannelId = config.musicChannelID;
        const voiceChannel = interaction.client.channels.cache.get(voiceChannelId);

        //create audio player
        const player = createAudioPlayer();

        player.on(AudioPlayerStatus.Playing, () => {
            console.log("Player playing.");
        });
        player.on('error', error => {
            console.error('Error: ${error.message} with resource');
        });
        const filePath = path.join(__dirname, 'temp.mp3');
        const response = await axios.get(attachment.url, {responseType: 'arraybuffer'});
        fs.writeFileSync(filePath,response.data);

        /*

        const resource = createAudioResource(filePath);
        player.play(resource);

        //connect to vc
        const connection = joinVoiceChannel({
            channelId: voiceChannelId,
            guildId: guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        });
        interaction.reply("created voice connection");

        const subscription = connection.subscribe(player);
        //const buffer = fs.readFileSync("C:\\Users\\talma\\Downloads\\urban-drum-pack-hi-hat-loop-avion_136bpm.mp3");
        //const duration = getMP3Duration(buffer);
        console.log(attachment.duration * 1000);
        if (subscription) {
            setTimeout(() => subscription.unsubscribe(), attachment.duration * 1000);
            await sleep(attachment.duration * 1000);
            connection.destroy();
        }
        //player.stop();
        */

        try {
            // Download the attachment
            const filePath = path.join(__dirname, 'temp.mp3');
            const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
            fs.writeFileSync(filePath, response.data);

            // Join the voice channel
            const connection = joinVoiceChannel({
                channelId: interaction.member.voice.channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            // Create an audio player and play the file
            const player = createAudioPlayer();
            const resource = createAudioResource(filePath);

            player.play(resource);
            connection.subscribe(player);

            player.on(AudioPlayerStatus.Playing, () => {
                console.log('The audio is now playing!');
            });

            player.on(AudioPlayerStatus.Idle, () => {
                console.log('The audio has finished playing!');
                fs.unlinkSync(filePath); // Delete the file after playing
                connection.destroy(); // Leave the voice channel
            });

            player.on('error', (error) => {
                console.error(`Error: ${error.message}`);
                fs.unlinkSync(filePath); // Delete the file on error
                connection.destroy(); // Leave the voice channel on error
            });

            await interaction.reply({ content: 'Playing your audio file!', ephemeral: true });
        } catch (error) {
            console.error('Failed to download or play the file:', error);
            await interaction.reply({ content: 'There was an error processing your file.', ephemeral: true });
        }
    },
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getLinkmp3(link) {
    console.log(link);
    fs.readFile('C:\\Users\\talma\\PhpstormProjects\\BotForDuck\\mp3downloads\\vidLink.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the JSON file:', err);
            return;
        }

        try {
            // Parse the JSON data into an object
            const jsonData = JSON.parse(data);

            // Update the videoLink property
            jsonData.linkToVid = link;

            // Convert the updated object back to JSON
            const updatedJsonData = JSON.stringify(jsonData, null, 4);

            // Write the updated JSON back to the file
            fs.writeFile('C:\\Users\\talma\\PhpstormProjects\\BotForDuck\\mp3downloads\\vidLink.json', updatedJsonData, 'utf8', (err) => {
                if (err) {
                    console.error('Error writing to the JSON file:', err);
                    return;
                }

                console.log('Video link updated successfully!');
            });
        } catch (err) {
            console.error('Error parsing JSON:', err);
        }
    });
    runPythonScript();
}

function runPythonScript() {
    // Spawn a child process to execute the Python script
    const pythonProcess = spawn('python', ['example.py']);

    // Capture the output data from the Python script
    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python Output: ${data}`);
    });

    // Capture any error messages from the Python script
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    // Handle the close event when the Python script finishes execution
    pythonProcess.on('close', (code) => {
        console.log(`Python script finished with code ${code}`);
    });
}