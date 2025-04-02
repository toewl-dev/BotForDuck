const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus, joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const axios = require("axios");
const fs = require('fs');
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays Music.')
        .addAttachmentOption(option =>
            option
                .setName('file')
                .setDescription('MP3 file to play')
                .setRequired(false)),
    async execute(interaction) {
        const attachment = interaction.options.getAttachment('file');
        if (!attachment) {
            await interaction.reply({ content: 'Please provide a valid MP3 file.', ephemeral: true });
            return;
        }

        const fileName = attachment.name.toLowerCase();
        const isMp3 = fileName.endsWith('.mp3') || (attachment.contentType && attachment.contentType === 'audio/mpeg');

        if (!isMp3) {
            await interaction.reply({ content: 'Please provide a valid MP3 file.', ephemeral: true });
            return;
        }

        const userVoiceChannel = interaction.member.voice.channel;
        if (!userVoiceChannel) {
            await interaction.reply({ content: 'You must be in a voice channel to use this command.', ephemeral: true });
            return;
        }

        try {
            // Download the attachment
            const filePath = path.join(__dirname, 'temp.mp3');
            const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
            fs.writeFileSync(filePath, response.data);

            // Join the user's voice channel
            const connection = joinVoiceChannel({
                channelId: userVoiceChannel.id,
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
