import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message } from 'discord.js';
import ms from 'ms';
import { Event } from '../../Structures/Event';

function createHelpEmbed(author: Message['author'], guildName?: string | undefined) {
	return new EmbedBuilder()
		.setColor('Green')
		.setDescription(`Hi ${author.username}, how can I help you out today? Leave a brief description of what your issue is, and someone will get to you as soon as they are free. \n\n
		This message will self-destruct in 1 minute. You can use the \`/faq\` command for frequently Asked Questions`)
		.setThumbnail(`${author.displayAvatarURL({ size: 512 })}`)
		.setFooter({ text: guildName !== undefined ? guildName : '' });
}

function createButtonRow() {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://github.com/SkullGaming31/skullgaming31')
			.setLabel('SkullGaming31\'s Github'),
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://twitch.tv/canadiendragon')
			.setLabel('SkullGaming31\'s Twitch'),
	);
}

async function handleHelpMessage(message: Message) {
	const { author, guild, content } = message;
	const bot = guild?.members.cache.get('1130601240871571688');

	if (!guild || author.bot) return;

	if (content.includes('@here') || content.includes('@everyone')) return;

	if (!content.includes(`${bot?.id}`)) return;

	const embed = createHelpEmbed(author, guild?.name);
	const row = createButtonRow();

	const msg = await message.reply({ embeds: [embed], components: [row] });
	setInterval(() => { msg.delete().catch(err => { if (err.code !== 10008) return console.error(err); }); }, ms('1m'));
}

export default new Event<'messageCreate'>('messageCreate', handleHelpMessage);