import { ActivityType, Client } from 'discord.js';
import { Event } from '../../Structures/Event';

export default new Event<'ready'>('ready', async (client: Client) => {
	console.log(`${client.user?.username} is online`);
	client.user?.setActivity({ name: 'In Development', type: ActivityType.Watching });
});