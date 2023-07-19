import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'faq',
	description: 'get help with your issues for the DayD Server',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'option',
			description: 'FAQ Options',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{
					name: 'Can i use mouse and keyboard on this server?',
					value: 'Can i use mouse and keyboard on this server?',
				},
				{
					name: 'How often does the Server restart?',
					value: 'How often does the Server restart?'
				},
				{
					name: 'how do i access the map in the server?',
					value: 'how do i access the map in the server?'
				}
			]
		},
		{
			name: 'target',
			description: 'Who do you want to tag in the message',
			type: ApplicationCommandOptionType.User,
			required: false
		}
	],
	run: async ({ interaction }) => {
		console.log('command sent');
		
		const { options } = interaction;

		const Options = options.getString('option');
		const Target = options.getUser('target');

		// const Channel = guild?.channels.cache.get('959693430244642822');

		const Embed = new EmbedBuilder().setColor(Colors.White).setFooter({ text: 'CanadienDragon' });

		switch (Options) {
		case 'Can i use mouse and keyboard on this server?':
			if (Target) {
				await interaction.reply({ content: `${Target}`,
					embeds: [
						Embed.setTitle('Can i use mouse and keyboard on this server?'),
						Embed.setDescription('Yes Mouse and keyboard is enabled for this server'),
						Embed.setColor('Green')
					]
				});
			} else {
				await interaction.reply({
					embeds: [
						Embed.setTitle('Can i use mouse and keyboard on this server?'),
						Embed.setDescription('Yes Mouse and keyboard is enabled for this server'),
						Embed.setColor('Green')
					],
					ephemeral: true
				});
			}
			break;
		case 'How often does the Server restart?':
			if (Target) {
				interaction.reply({ content: `${Target}`,
					embeds: [
						Embed.setTitle('How often does the Server restart?'),
						Embed.setDescription('the server is on a automatic restart every 4 hours'),
						Embed.setColor('Green')
					]
				});
			} else {
				interaction.reply({
					embeds: [
						Embed.setTitle('How often does the Server restart?'),
						Embed.setDescription('the server is on a automatic restart every 4 hours'),
						Embed.setColor('Green')
					],
					ephemeral: true
				});
			}
			break;
		case 'how do i access the map in the server?':
			if (Target) {
				interaction.reply({
					content: `${Target}`,
					embeds: [
						Embed.setTitle('how do i access the map in the server?'),
						Embed.setDescription('if your on keyboard and mouse you can just press m, controller you need tourst map'),
						Embed.setColor('Green')
					]
				});
			} else {
				interaction.reply({
					embeds: [
						Embed.setTitle('how do i access the map in the server?'),
						Embed.setDescription('if your on keyboard and mouse you can just press m, controller you need tourst map'),
						Embed.setColor('Green')
					],
					ephemeral: true
				});
			}
			break;
		default: {
			const errEmbed = new EmbedBuilder().setTitle('ERROR ENCOUNTER').setDescription('Error sending messages to the discord server').setColor('Red');
			interaction.reply({ embeds: [errEmbed], ephemeral: true });
		}
			break;
		}
	}
});