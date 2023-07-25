import { ActionRowBuilder, ApplicationCommandType, ChannelType, EmbedBuilder, ModalActionRowComponentBuilder, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle, bold, underscore } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'changelogs',
	description: 'Send an embed from a model',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageGuild'],
	defaultMemberPermissions: [],
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		const { user } = interaction;
		const modal = new ModalBuilder({
			customId: `myModel-${user.id}`,
			title: 'Changelogs'
		});

		const changelogsChanges = new TextInputBuilder({
			customId: 'changelogsChanges',
			label: 'What changes were made to the server',
			style: TextInputStyle.Paragraph,
			minLength: 1,
			maxLength: 2048
		});

		const changelogsAdditions = new TextInputBuilder({
			customId: 'changelogsAdditions',
			label: 'What additions were made to the server',
			style: TextInputStyle.Paragraph,
			minLength: 1,
			maxLength: 2048
		});

		const changelogsUpdate = new TextInputBuilder({
			customId: 'changelogsUpdate',
			label: 'What update number are you posting',
			style: TextInputStyle.Short,
			minLength: 1,
			maxLength: 100
		});

		const firstActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(changelogsChanges);
		const secondActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(changelogsAdditions);
		const thirdActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(changelogsUpdate);

		modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

		await interaction.showModal(modal);

		const filter = (interaction: ModalSubmitInteraction) => interaction.customId === `myModel-${user.id}`;

		await interaction.awaitModalSubmit({ filter, time: 300000 }).then(async (modalInteraction) => {
			const changelogsChangesValue = modalInteraction.fields.getTextInputValue('changelogsChanges');
			const changelogsAdditionValue = modalInteraction.fields.getTextInputValue('changelogsAdditions');
			const changelogsUpdateValue = modalInteraction.fields.getTextInputValue('changelogsUpdate');
			const targetChannel = interaction.guild?.channels.cache.get('1131412234510282753');

			const embed = new EmbedBuilder()
				.setTitle(underscore(`$Update ${changelogsUpdateValue}`))
				.setDescription(`${bold('DayD Changes')}: \n\`${changelogsChangesValue}\n\`\n${bold('DayD Additions')}: \n\`${changelogsAdditionValue}\n\``)
				.setColor('Green')
				.setThumbnail(user.displayAvatarURL({ size: 512 }))
				.setTimestamp();

			if (targetChannel?.type === ChannelType.GuildText) await targetChannel.send({ content: '@here', embeds: [embed] });
			await modalInteraction.reply({ content: 'Modal Submitted', ephemeral: true });
		});
	}
});