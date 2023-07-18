import { ApplicationCommandDataResolvable, Client, ClientEvents, Collection, GatewayIntentBits, Partials } from 'discord.js';
import glob from 'glob';
import { Agent } from 'undici';
import { promisify } from 'util';
const PG = promisify(glob);

import axios from 'axios';
import { CommandType } from '../Typings/Command';
import { RegisterCommandOptions } from '../Typings/client';
import { Event } from './Event';

export class ExtendedClient extends Client {
	commands: Collection<string, CommandType> = new Collection();

	constructor () {
		super({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent
			],
			partials: [
				Partials.Channel,
				Partials.GuildMember,
				Partials.GuildScheduledEvent,
				Partials.Message,
				Partials.Reaction,
				Partials.ThreadMember,
				Partials.User
			],
			allowedMentions: {
				parse: ['everyone', 'roles', 'users']
			},
			rest: { timeout: 60000 }
		});
	}
	async start() {
		const agent = new Agent({
			connect: {
				timeout: 300000
			}
		});

		// Check server status every 5 minutes
		setInterval(checkAndStartServer, 5 * 60 * 1000);

		this.rest.setAgent(agent);
		this.registerModules();
		await this.login(process.env.DISCORD_BOT_TOKEN);
	}

	async importFile(filePath: string) {
		return (await import(filePath))?.default;
	}

	async registerCommands({ commands, guildId }: RegisterCommandOptions): Promise<void> {
		if (guildId) {
			this.guilds.cache.get(guildId)?.commands.set(commands);
			console.log(`Registering commands to ${guildId}`);
		} else {
			this.application?.commands.set(commands);
			console.log('Registering Global commands');
		}
	}

	async registerModules() {
		//Commands
		const slashCommands: ApplicationCommandDataResolvable[] = [];
		const commandFiles = await PG(`${__dirname}/../Commands/*/*{.ts,.js}`);
		// console.log({ commandFiles });

		commandFiles.forEach(async (filePath) => {
			const command: CommandType = await this.importFile(filePath);

			if (!command.name) return;

			this.commands.set(command.name, command);
			slashCommands.push(command);
		});

		this.on('ready', () => {
			this.registerCommands({ commands: slashCommands, guildId: undefined });
		});

		//Event
		const eventFiles = await PG(`${__dirname}/../Events/*/*{.ts,.js}`);
		// console.log({ eventFiles });

		eventFiles.forEach(async (filePath) => {
			const event: Event<keyof ClientEvents> = await this.importFile(filePath);
			if (event.event === 'ready') { this.once(event.event, event.run); } else { this.on(event.event, event.run); }
		});
	}
}
async function checkAndStartServer() {
	try {
		const response = await axios.get(`https://api.nitrado.net/services/${process.env.ID1}/gameservers`, {
			headers: {
				'Authorization': `Bearer ${process.env.NITRATOKEN}`,
				'Accept': 'application/json'
			}
		});

		const gameServer = response.data.data.gameserver;
		const serverStatus = gameServer.status;

		if (serverStatus === 'stopped') {
			console.log('The server is currently stopped. Starting the server...');
			await startGameServer();
		} else {
			console.log('The server is already running.');
			return;
		}
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response) {
				const { status, statusText, data } = error.response;
				if (status === 401) {
					console.error('Failed to start game server. Access token is not valid (anymore).');
				} else if (status === 429) {
					console.error('Failed to start game server. Rate limit exceeded. Please contact support for a higher rate limit.');
				} else if (status === 503) {
					console.error('Failed to start game server. API is currently unavailable due to maintenance. Please try again later.');
				} else {
					console.error(`Failed to start game server. Status Code: ${status}, Status Text: ${statusText}, Response Data:`, data);
				}
			} else if (error.request) {
				console.error('No response received while starting game server');
			} else {
				console.error('Error setting up request to start game server:', error.message);
			}
		} else {
		// Error handling
			console.error('Error occurred while checking and starting the server:', error);
		}
	}
}

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
			console.log('Game server started successfully:', response.data);
		} else {
			console.error(`Failed to start game server. Status Code: ${response.status}, Status Text: ${response.statusText}`);
		}
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response) {
				const { status, statusText, data } = error.response;
				if (status === 401) {
					console.error('Failed to start game server. Access token is not valid (anymore).');
				} else if (status === 429) {
					console.error('Failed to start game server. Rate limit exceeded. Please contact support for a higher rate limit.');
				} else if (status === 503) {
					console.error('Failed to start game server. API is currently unavailable due to maintenance. Please try again later.');
				} else {
					console.error(`Failed to start game server. Status Code: ${status}, Status Text: ${statusText}, Response Data:`, data);
				}
			} else if (error.request) {
				console.error('No response received while starting game server');
			} else {
				console.error('Error setting up request to start game server:', error.message);
			}
		} else {
			console.error('Error starting game server:', error);
		}
	}
}