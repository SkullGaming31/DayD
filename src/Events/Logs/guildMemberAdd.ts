import { ChannelType, EmbedBuilder, TextBasedChannel, channelMention, userMention } from 'discord.js';
import { MongooseError } from 'mongoose';

import settings from '../../Database/Schemas/settingsDB';
import { Event } from '../../Structures/Event';

export default new Event<'guildMemberAdd'>('guildMemberAdd', async (member) => {
	const { guild, user } = member;

	const data = await settings.findOne({ GuildID: guild.id }).catch((err: MongooseError) => { console.error(err.message); });
	if (data?.WelcomeChannel === undefined) return;
	const logsChannelOBJ = guild.channels.cache.get(data.WelcomeChannel) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	// let messageToSend: string;
	// if (guild.rulesChannel) {
	// 	messageToSend = `Welcome to ${guild.name}'s server! Please read the rules in <#${guild.rulesChannelId}>.`;
	// } else {
	// 	messageToSend = `Welcome to ${guild.name}'s server!`;
	// }
	const messageToSend = guild.rulesChannel ? `Welcome to ${guild.name}'s server! Please read the rules in <#${guild.rulesChannelId}>.` : `Welcome to ${guild.name}'s server!`;
	const changeLogs = channelMention('1131412234510282753');

	const embed = new EmbedBuilder()
		.setTitle('New Member')
		.setDescription(messageToSend)
		.setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ size: 512 })})
		.setColor('Blue')
		.addFields([
			{
				name: 'Account Created: ',
				value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
				inline: true,
			},
			{
				name: 'Latest Member Count: ',
				value: `${guild.memberCount}`,
				inline: true,
			},
			{
				name: 'Changelogs',
				value: `${changeLogs}`,
				inline: true
			}
		])
		.setThumbnail(guild.iconURL({ size: 512 }))
		.setFooter({ text: `UserID: ${member.id}`})
		.setTimestamp();
	try {
		if (data.Welcome === true) {
			const userWelcome = userMention(member.id);
			await logsChannelOBJ.send({ content: `Welcome ${userWelcome}`, embeds: [embed] });
		}
	} catch (error) {
		console.error(error);
	}
});