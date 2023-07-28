import {
	ApplicationCommandDataResolvable,
	ChannelType,
	Client,
	ClientEvents,
	Collection,
	GatewayIntentBits,
	Partials,
	TextBasedChannel,
	TextChannel,
} from 'discord.js';
import glob from 'glob';
import { Agent } from 'undici';
import { promisify } from 'util';
const PG = promisify(glob);

import axios from 'axios';
import { RestartRequestBody } from '../Commands/Moderator/dayz';
import { CommandType } from '../Typings/Command';
import { RegisterCommandOptions } from '../Typings/client';
import { Event } from './Event';

export class ExtendedClient extends Client {
	commands: Collection<string, CommandType> = new Collection();

	constructor() {
		super({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
			],
			partials: [
				Partials.Channel,
				Partials.GuildMember,
				Partials.GuildScheduledEvent,
				Partials.Message,
				Partials.Reaction,
				Partials.ThreadMember,
				Partials.User,
			],
			allowedMentions: {
				parse: ['everyone', 'roles', 'users'],
			},
			rest: { timeout: 60000 },
		});
		this.checkAndStartServer = this.checkAndStartServer.bind(this); // Bind the context of checkAndStartServer to the instance of ExtendedClient
	}

	async start() {
		const agent = new Agent({
			connect: {
				timeout: 300000,
			},
		});

		this.rest.setAgent(agent);
		this.registerModules();
		await this.login(process.env.DISCORD_BOT_TOKEN);
		// Wait until the client is ready before starting the update intervals
		this.once('ready', () => {
			// Check server status every 5 minutes
			setInterval(this.checkAndStartServer, 5 * 60 * 1000); // 5 * 60 * 1000 5 minutes

			// Update the voice channel name every 5 minutes
			setInterval(() => this.updateVoiceChannelName(), 30000);

			// Update the slots channel name every 5 minutes
			setInterval(() => this.updateSlotsChannel(), 30000);
		});
	}

	async importFile(filePath: string) {
		return (await import(filePath))?.default;
	}

	async registerCommands({ commands, guildId, }: RegisterCommandOptions): Promise<void> {
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
			if (event.event === 'ready') {
				this.once(event.event, event.run);
			} else {
				this.on(event.event, event.run);
			}
		});
	}

	async checkAndStartServer() {
		try {
			const response = await axios.get(
				`https://api.nitrado.net/services/${process.env.ID1}/gameservers`,
				{
					headers: {
						Authorization: `Bearer ${process.env.NITRATOKEN}`,
						Accept: 'application/json',
					},
				}
			);

			const gameServer = response.data.data.gameserver;
			const serverStatus = gameServer.status;

			if (serverStatus === 'stopped') {
				console.log('The server is currently stopped. Starting the server...');
				const restartMessage =
					'Automatic restart from DayD Killfeed Discord Bot';
				await this.startGameServer(restartMessage); // Use this.startGameServer instead of startGameServer

				// Get the announcement channel by its ID
				const announcementChannel = this.channels.cache.get('1130984356668776558') as TextChannel;

				// Send a message to the announcement channel
				if (announcementChannel) {
					await announcementChannel.send({ content: 'The server is started after a crash! :tada:' });
				} else {
					console.error('Announcement channel not found. Make sure to provide the correct channel ID.');
				}
			} else if (serverStatus === 'restarting') {
				console.log('The server is currently restarting. Please wait for it to start.');
			} else if (serverStatus === 'pending') {
				console.log('The server is pending and not yet fully started. Please wait for it to start.');
			} else {
				console.log('The server is already running.');
				return;
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (error.response) {
				const { status } = error.response;
				switch (status) {
				case 401:
					throw {
						status: 401,
						message: 'The provided access token is not valid (anymore).',
					};
				case 429:
					throw {
						status: 429,
						message:
								'The rate limit has been exceeded. Please contact our support if you have a legitimate reason to get a higher rate limit.',
					};
				case 503:
					throw {
						status: 503,
						message:
								'Maintenance. API is currently not available. Please come back in a few minutes and try it again.',
					};
				default:
					console.error(
						'An error occurred while checking the server status:'
					);
				}
			} else {
				console.error(
					'An error occurred while checking the server status:',
					error
				);
			}
		}
	}

	// Function to fetch online players and slots from the Nitrado API
	async fetchServerData(): Promise<{
		onlinePlayers: number;
		slots: number;
	} | null> {
		try {
			const response = await axios.get(
				`https://api.nitrado.net/services/${process.env.ID1}/gameservers`,
				{
					headers: {
						Authorization: `Bearer ${process.env.NITRATOKEN}`,
						Accept: 'application/json',
					},
				}
			);

			const gameServer = response.data.data.gameserver;
			const onlinePlayers = gameServer.query.player_current;
			const slots = gameServer.slots;

			return { onlinePlayers, slots };
		} catch (error) {
			console.error('Error fetching server data from Nitrado API:', error);
			return null;
		}
	}

	// Update the voice channel name with the number of online players
	async updateVoiceChannelName(): Promise<void> {
		const voiceChannelID = '1133440952506261576'; // Replace this with the ID of the voice channel you want to update

		const voiceChannel = this.channels.cache.get(
			voiceChannelID
		) as TextBasedChannel | null;
		if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) return;

		const serverData = await this.fetchServerData();
		if (serverData !== null) {
			const { onlinePlayers } = serverData;
			await voiceChannel.setName(`Online: ${onlinePlayers}`);
		}
	}

	// Update the slots channel with the number of slots
	async updateSlotsChannel(): Promise<void> {
		const slotsChannelID = '1133441459144638660'; // Replace this with the ID of the channel you want to update with the slots count

		const slotsChannel = this.channels.cache.get(
			slotsChannelID
		) as TextBasedChannel | null;
		if (!slotsChannel || slotsChannel.type !== ChannelType.GuildVoice) return;

		const serverData = await this.fetchServerData();
		if (serverData !== null) {
			const { slots } = serverData;
			await slotsChannel.setName(`Slots: ${slots}`);
		}
	}

	async startGameServer(message?: string): Promise<void> {
		try {
			const requestBody: RestartRequestBody = {};

			if (message) {
				requestBody.message = message;
			}

			const response = await axios.put(
				// Use PUT method for updating the message
				`https://api.nitrado.net/services/${process.env.ID1}/gameservers/restart`,
				requestBody,
				{
					headers: {
						Authorization: `Bearer ${process.env.NITRATOKEN}`,
						'Content-Type': 'application/json',
					},
				}
			);

			if (response.status === 200) {
				console.log('Game server started successfully:', response.data);
			} else {
				console.error(
					`Failed to start game server. Status Code: ${response.status}, Status Text: ${response.statusText}`
				);
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response) {
					const { status, statusText, data } = error.response;
					if (status === 401) {
						console.error(
							'Failed to start game server. Access token is not valid (anymore).'
						);
					} else if (status === 429) {
						console.error(
							'Failed to start game server. Rate limit exceeded. Please contact support for a higher rate limit.'
						);
					} else if (status === 503) {
						console.error(
							'Failed to start game server. API is currently unavailable due to maintenance. Please try again later.'
						);
					} else {
						console.error(
							`Failed to start game server. Status Code: ${status}, Status Text: ${statusText}, Response Data:`,
							data
						);
					}
				} else if (error.request) {
					console.error('No response received while starting game server');
				} else {
					console.error(
						'Error setting up request to start game server:',
						error.message
					);
				}
			} else {
				console.error('Error starting game server:', error);
			}
		}
	}
}
