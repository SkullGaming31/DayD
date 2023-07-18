import axios from 'axios';
import { ApplicationCommandType } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'dayz',
	description: 'Start and restart the DayZ Server',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		try {
			const announcementChannelId = '1130984356668776558';
			if (announcementChannelId) {
				const announcementChannel = interaction.guild?.channels.cache.get(announcementChannelId);
				await interaction.reply({ content: 'Server Restarting...', ephemeral: true });
				startGameServer();
				if (announcementChannel?.isTextBased()) {
					await announcementChannel.send({ content: '@everyone, the server is restarting. It should be back up momentarily.' }).catch((err: Error) => {
						console.error(err);
					});
				}
			} else {
				return interaction.reply({ content: 'Could not restart the server' });
			} 
		} catch (error) {
			console.error(error);
			return;
		}
	}
});

async function startGameServer(): Promise<void> {
	try {
		const response = await axios.post(
			`https://api.nitrado.net/services/${process.env.ID1}/gameservers/restart`,
			{},
			{
				headers: {
					'Authorization': `Bearer ${process.env.NITRATOKEN}`,
					'Content-Type': 'application/json',
				},
			}
		);

		if (response.status === 200) {
			console.log('DayZ server restarted successfully:', response.data);
		} else {
			console.error(`Failed to restart DayZ server. Status Code: ${response.status}, Status Text: ${response.statusText}`);
		}
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response) {
				const { status, statusText, data } = error.response;
				if (status === 401) {
					console.error('Failed to restart DayZ server. Access token is not valid (anymore).');
				} else if (status === 429) {
					console.error('Failed to restart DayZ server. Rate limit exceeded. Please contact support for a higher rate limit.');
				} else if (status === 503) {
					console.error('Failed to restart DayZ server. API is currently unavailable due to maintenance. Please try again later.');
				} else {
					console.error(`Failed to restart DayZ server. Status Code: ${status}, Status Text: ${statusText}, Response Data:`, data);
				}
			} else if (error.request) {
				console.error('No response received while restarting DayZ server');
			} else {
				console.error('Error setting up request to restart DayZ server:', error.message);
			}
		} else {
			console.error('Error restarting DayZ server:', error);
		}
	}
}