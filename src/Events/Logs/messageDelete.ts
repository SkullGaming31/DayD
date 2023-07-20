import { ChannelType, EmbedBuilder, ErrorEvent, Message, PartialMessage, TextBasedChannel, channelMention } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB'; // DB
import { Event } from '../../Structures/Event';

export default new Event<'messageDelete'>('messageDelete', async (message: Message | PartialMessage) => {
	if (!message.inGuild()) return;

	const { guild, author, channel } = message;
	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });

	if (!data || data?.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	const channelSearch = channelMention(channel.id);

	const logsEmbed = new EmbedBuilder()
		.setTitle('Automated Message Deletion')
		.setAuthor({ name: author?.username ?? 'Thread Message Deleted'})
		.setColor('Red')
		.addFields([
			{ name: 'User', value: `\`${author?.username ?? 'Unknown'}\`` },
			{ name: '🚨 | Deleted Message: ', value: `\`${message.content ?? 'None'}\``.slice(0, 4096) },
			{ name: 'Channel', value: `${channelSearch}` },
		])
		.setURL(`${message.url}`)
		.setFooter({ text: `UserID: ${author?.id ?? 'Unknown'}` })
		.setTimestamp();

	if (message.attachments.size >= 1) {
		logsEmbed.addFields({ name: 'Attachments:', value: `${message.attachments.map((a) => a.url)}`, inline: true });
	}

	try {
		await logsChannelOBJ.send({ embeds: [logsEmbed] }).catch((err: ErrorEvent) => { console.error(err.type + ':' + err.message); });
	} catch (err) {
		console.error(err);
	}
});