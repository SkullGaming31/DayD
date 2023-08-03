import axios from 'axios';
import { ApplicationCommandOptionType, ApplicationCommandType, TextChannel } from 'discord.js';
import { Command } from '../../Structures/Command';

export interface RestartRequestBody {
  restart_message?: string;
	message?: string;
}

export default new Command({
	name: 'dayz',
	description: 'Start and restart the DayZ Server',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'restart_message',
			description: 'This message will be posted in the Ingame Chat if available.',
			type: ApplicationCommandOptionType.String,
			required: false
		},
		{
			name: 'message',
			description: 'This message will be posted in the restart.log File.',
			type: ApplicationCommandOptionType.String,
			required: false
		}
	],
	run: async ({ interaction }) => {
		const { options } = interaction;
		try {
			const announcementChannelId = '1130984356668776558'; // '1130984356668776558'
			if (announcementChannelId) {
				const announcementChannel = interaction.guild?.channels.cache.get(announcementChannelId) as TextChannel;
				await interaction.reply({ content: 'Server Restarting...', ephemeral: true });
				if (announcementChannel?.isTextBased()) {
					await announcementChannel.send({ content: '@everyone, the server will restart in 5 Minutes' }).catch((err: Error) => {
						console.error(err);
					});
				}

				// Access the restart_message option's value from the command options
				const restart_message: string | undefined = options.getString('restart_message') || undefined;

				const startTime: number = Date.now();

				// Call the logTimeLeft function every minute (60000 milliseconds)
				const interval = setInterval(() => logTimeLeft(startTime, announcementChannel), 60000);

				// Set the timeout for 300000 milliseconds (5 minutes)
				setTimeout(() => {
					clearInterval(interval); // Clear the interval when the timeout is executed
					startGameServer(restart_message); // Pass the restart_message to the startGameServer function
					// console.log('simulating startGameServer');
				}, 300000); // 300000 milliseconds (5 minutes)
			} else {
				return interaction.reply({ content: 'Could not restart the server', ephemeral: true });
			} 
		} catch (error) {
			console.error(error);
		}
	}
});

async function startGameServer(restart_message?: string, message?: string): Promise<void> {
	try {
		const requestBody: RestartRequestBody = {};
		if (restart_message) {
			requestBody.restart_message = restart_message;
			requestBody.message = message;
		}

		const response = await axios.post(
			`https://api.nitrado.net/services/${process.env.ID1}/gameservers/restart`,
			requestBody,
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

// Function to calculate and log the time left in minutes
async function logTimeLeft(startTime: number, announcementChannel: TextChannel) {
	const currentTime = Date.now();
	const timeLeftMs = 300000 - (currentTime - startTime);
	const timeLeftMinutes = Math.ceil(timeLeftMs / 60000); // Convert milliseconds to minutes and round up
	console.log(`Server Restart: ${timeLeftMinutes} minutes`);

	if (timeLeftMinutes === 2) {
		await announcementChannel?.send({ content: '@here There are 2 minutes left before the restart. Please log out to prevent corrupted data.' })
			.catch((err: Error) => {
				console.error(err);
			});
	}
}