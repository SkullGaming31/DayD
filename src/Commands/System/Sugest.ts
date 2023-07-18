import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import DB from '../../Database/Schemas/SuggestDB';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'suggest',
	description: 'Suggest an improvement for the discord bot',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'suggestion',
			description: 'Describe your suggestion',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'type',
			description: 'The type of suggestion',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{ name: 'Discord', value: 'Discord' },
				{ name: 'Server', value: 'Server' }
			]
		}
	],
	run: async ({ interaction }) => {
		const { options, guildId, channel, guild, member, user } = interaction;

		const Suggestion = options.getString('suggestion');
		const Type = options.getString('type');

		const Response = new EmbedBuilder()
			.setTitle('NEW SUGGESTION')
			.setColor('Blue')
			.setAuthor({ name: `${user.username}`, iconURL: `${user.displayAvatarURL({ size: 512 })}` })
			.addFields(
				{ name: 'Suggestion', value: `${Suggestion}` },
				{ name: 'Type', value: `${Type}` },
				{ name: 'Status', value: 'Pending...' }
			)
			.setTimestamp();

		const Buttons = new ActionRowBuilder<ButtonBuilder>();
		Buttons.addComponents(
			new ButtonBuilder().setCustomId('sugges-accept').setLabel('✅ Accept').setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId('sugges-decline').setLabel('⛔ Decline').setStyle(ButtonStyle.Danger)
		);

		try {
			const settings = await SettingsModel.findOne({});
			if (!settings) return interaction.reply({ content: 'No Guild Settings found, please run the ``/settings`` command' });
			if (!settings.SuggestChan) return interaction.reply({ content: 'no suggestion channel found please run the ``/settings`` command' });

			const suggestionChannel = guild?.channels.cache.get(settings.SuggestChan);
			if (channel?.id !== '1130764222528233572') return interaction.reply({ content: `❌ | you may only use this command in the suggestion channel ${suggestionChannel}` });
			if (guild?.id !== '1129704657644699648') return interaction.reply({ content: '❌ | you may only use this command in the DayD Discord Server' });

			const M = await interaction.reply({ embeds: [Response], components: [Buttons], fetchReply: true });

			await DB.create({
				guildId: guildId,
				MessageID: M.id,
				Details: [
					{
						MemberID: member.id,
						Title: Type,
						Suggestion: Suggestion
					}
				]
			});
		} catch (error) { console.error(error); }
	}
});