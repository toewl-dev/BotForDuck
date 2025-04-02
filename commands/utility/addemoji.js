const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addemoji')
        .setDescription('Add a server emoji!')
        .addStringOption(option =>
            option
                .setName('emojiname')
                .setDescription('Emoji Name')
                .setRequired(true))
        .addAttachmentOption(option =>
            option
                .setName('file')
                .setDescription('Emoji file')
                .setRequired(true)),
    async execute(interaction) {
        const attachment = interaction.options.getAttachment('file');
        if (!attachment) {
            await interaction.reply({content: 'Please provide a JPEG, PNG, or GIF file', ephemeral: false});
            return;
        }
        if (attachment.size > 256000) {
            await interaction.reply({content: 'The file you have provided is too large!', ephemeral: false});
        }

        const fileName = attachment.name.toLowerCase();
        if (!checkName(fileName)) {
            await interaction.reply({content: 'Please provide a ***valid*** JPEG, PNG, or GIF file', ephemeral: false});
        }
        const emojiName = interaction.options.get('emojiname').value;
        //await interaction.reply(`This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`);

        try {
            const emoji = await interaction.guild.emojis.create({
                attachment: attachment.url,
                name: emojiName,
            });
            await interaction.reply('Emoji has been added!');
        } catch (e) {
            console.error(e);
            await interaction.reply('There was a problem :(');
        }
    },
};

function checkName(name) {
    return name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.gif');
}

