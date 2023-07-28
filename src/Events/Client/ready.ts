import axios from 'axios';
import { ActivityType, ChannelType, Client, TextBasedChannel } from 'discord.js';
import { Event } from '../../Structures/Event';

export default new Event<'ready'>('ready', async (client: Client) => {
	const onlineMembersChannelId = 'ONLINE_MEMBERS_CHANNEL_ID';
	const slotsChannelId = 'SLOTS_CHANNEL_ID';

	console.log(`${client.user?.username} is online`);
	client.user?.setActivity({ name: 'In Development', type: ActivityType.Watching });

	// Use setInterval to fetch and update data every 5 minutes
	setInterval(async () => {
		const onlineMembersChannel = client?.channels.cache.get(onlineMembersChannelId);
		const slotsChannel = client?.channels.cache.get(slotsChannelId);

		if (!onlineMembersChannel || onlineMembersChannel.type !== ChannelType.GuildVoice) return;
		if (!slotsChannel || slotsChannel.type !== ChannelType.GuildVoice) return;

		const { onlineMembers, slots } = await fetchServerData();

		updateChannelName(onlineMembersChannel, `Online: ${onlineMembers}`);
		updateChannelName(slotsChannel, `Slots: ${slots}`);
	}, 30000); // Run every 5 minutes 5 * 60 * 1000
});

// Function to fetch data from Nitrado API
async function fetchServerData(): Promise<{ onlineMembers: number; slots: number }> {
	try {
		const response = await axios.get(`https://api.nitrado.net/services/${process.env.ID1}/gameservers`, {
			headers: {
				'Authorization': `Bearer ${process.env.NITRATOKEN}`,
				'Accept': 'application/json'
			}
		});

		const gameServer = response.data.data.gameserver;
		const onlineMembers = gameServer.query.player_current;
		const slots = gameServer.slots;

		return { onlineMembers, slots };
	} catch (error) {
		console.error('Error fetching server data:', error);
		return { onlineMembers: 0, slots: 0 };
	}
}

// Function to update channel name with fetched data
async function updateChannelName(channel: TextBasedChannel, name: string) {
	try {
		if (channel.type === ChannelType.GuildVoice) await channel.setName(name);
		console.log(`Channel name updated to: ${name}`);
	} catch (error) {
		console.error('Error updating channel name:', error);
	}
}