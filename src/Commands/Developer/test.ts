import axios from 'axios';
import { ApplicationCommandType } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'test',
	description: 'Testing commands with apis',
	UserPerms: ['ManageGuild'],
	BotPerms: ['ManageGuild'],
	defaultMemberPermissions: ['ManageGuild'],
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		//

		const request = await axios.get(`https://api.nitrado.net/services/${process.env.ID1}/gameservers`, { 
			headers: {
				'Authorization': `Bearer ${process.env.NITRATOKEN}`,
				'Content-Type': 'application/json',
			},
		});
		console.log(request.data.data);
		// const response = await axios.post(
		// 	`https://api.nitrado.net/services/${process.env.ID1}/gameservers/restart`,
		// 	requestBody,
		// 	{
		// 		headers: {
		// 			'Authorization': `Bearer ${process.env.NITRATOKEN}`,
		// 			'Content-Type': 'application/json',
		// 		},
		// 	}
		// );
		// if (response.status === 200) {
		// 	console.log('DayZ server restarted successfully:', response.data);
		// } else {
		// 	console.error(`Failed to restart DayZ server. Status Code: ${response.status}, Status Text: ${response.statusText}`);
		// }
		await interaction.reply({ content: 'This command is only used for testing out apis' });
	}
});
