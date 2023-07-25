/* eslint-disable no-inner-declarations */
import { ApplicationCommandOptionType, ApplicationCommandType, AttachmentBuilder, CategoryChannel, ChannelType, EmbedBuilder, GuildMember, channelMention, hyperlink } from 'discord.js';
import { config } from 'dotenv';
import { Command } from '../../Structures/Command';
config();

// import { GUILDID, PLATFORM, ID1, ID2, NITRATOKEN, REGION, KILLFEED_PARENT_CHANNEL_ID, KILLFEED_NAME, SERVER_NAME } from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import ini from 'ini';
import moment from 'moment-timezone';
import path from 'path';
import readline from 'readline';
import { Tail } from 'tail';
const server_config = ini.parse(fs.readFileSync('./src/config.ini', 'utf-8'));

const logFile = './src/logs/log.ADM';
const options = {
	separator: /[\r]{0,1}\n/,
	fromBeginning: false,
	useWatchFile: true,
	flushAtEOF: true,
	fsWatchOptions: { interval: 100 },
	follow: true,
	logger: console,
};

const tail = new Tail(logFile, options);
// const tail = new Tail(logFile, options);


let logStats: fs.Stats;
let logBytes = 0; 
let logSize = 0;
let logSizeRef = 0; 
let lineCount = 0;
let lineRef = 0;
let dt0 = 0;
const valueRef = new Set();
let iso;
let linkLoc = '';
let logDt = ' ';
const dt = new Date(); 
let todayRef = ' ';
let today: string;

const phrase1 = '>) killed by ', phrase2 = 'AdminLog started on ', phrase3 = 'from',  phrase4 = '>) bled out',  phrase5 = '>) committed suicide', phrase6 = '[HP: 0] hit by FallDamage', phrase7 = 'committed suicide', phrase8 = ' is connected ', phrase9 = ' has been disconnected';
const nextDay = false;
let feedStart = false;

if (parseInt(server_config.mapLoc) === 1) {
	linkLoc = 'https://www.izurvive.com/livonia/#location='; //LIVONIA
}
if (parseInt(server_config.mapLoc) === 0) {
	linkLoc = 'https://www.izurvive.com/#location='; //CHERNARUS
}

export default new Command({
	name: 'admin',
	description: 'Contains all Admin Killfeed commands',
	UserPerms: ['ManageGuild'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageGuild'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'killfeed',
			description: 'Admin Killfeed Commands',
			type: ApplicationCommandOptionType.SubcommandGroup,
			options: [
				{
					name: 'stop',
					description: 'Stops Killfeed',
					type: ApplicationCommandOptionType.Subcommand,
				},
				{
					name: 'start',
					description: 'Starts Killfeed',
					type: ApplicationCommandOptionType.Subcommand,
				},
				{
					name: 'deathloc',
					description: 'Toggle on display of death locations in Killfeed notifications',
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: 'state', 
							description: 'Select desired Alarm state',
							type:ApplicationCommandOptionType.String,
							required: true,
							choices: [
								{ name: 'ON', value: 'on'},
								{ name: 'OFF', value: 'off' }
							]
						}
					]
				},
				{
					name: 'clear',
					description: 'Clear channel messages (limit 100)',
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: 'value',
							description: 'Enter the amount of messages you want to clear from killfeed channel',
							required: true,
							type: ApplicationCommandOptionType.Integer,
						}
					]
				},
				{
					name: 'map',
					description: 'Toggle Killfeed Mission Map',
					type: ApplicationCommandOptionType.Subcommand
				},
				{
					name: 'setup',
					description: 'Set up Discord channels required by Killfeed',
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: 'category',
							description: 'Would you like to add your killfeed into a category channel?',
							type: ApplicationCommandOptionType.Boolean,
							required: true
						},
						{
							name: 'categoryname',
							description: 'The name for your category channel',
							type: ApplicationCommandOptionType.String,
							required: false
						}
					]
				}
			],
		},
	],
	run: async ({ interaction }) => {
		const { guildId, options } = interaction;
		const subCo = options.getSubcommand();
		const Category = options.getBoolean('category');
		
		
		const config = ini.parse(fs.readFileSync('./src/config.ini', 'utf-8'));
		const GUILDID = process.env.DISCORD_GUILD_ID;
		
		//Admin Commands
		if (subCo === 'clear') {
			if(guildId) {
				if (guildId != GUILDID) return;
				const integer = options.getInteger('value');
				if (!integer) return;
				if (integer > 100) return interaction.reply({ content: 'The max number of messages you can delete is 100', ephemeral: true })
					.catch((error) => { console.error(error); });
				if (interaction.channel?.type === ChannelType.GuildText) await interaction.channel?.bulkDelete(integer, true)
					.catch((error: Error) => { console.error(error); });
				await interaction.reply({ content: 'clearing messages...', ephemeral: true })
					.catch((error) => { console.error(error); });
			}
		}
		if (subCo === 'map') {
			if (guildId) {
				if (guildId != GUILDID) return;
				if (parseInt(config.mapLoc) === 1) {
					config.mapLoc = '0';
					fs.writeFileSync('./src/config.ini', ini.stringify(config));
					await interaction.reply({ content: 'Killfeed Map set to **Chernaus**', ephemeral: true }).catch((error) => { console.log(error); });
					return;
				}
				if (parseInt(config.mapLoc) === 0) {
					config.mapLoc = '1';
					fs.writeFileSync('./src/config.ini', ini.stringify(config));
					interaction.reply({ content: 'Killfeed Map set to **Livonia**', ephemeral: true }).catch((error) => { console.error(error); });
					return;
				}
			}
		}

		if (subCo === 'setup') {
			const botID = interaction.guild?.members.cache.get('1130601240871571688') as GuildMember;
			if (guildId) {
				if (guildId !== GUILDID) return;
				const kfChannel = interaction.guild?.channels.cache.find(channel => channel.name.includes(process.env.KILLFEED_NAME as string));
				if (!kfChannel) {
					if (Category === true) {
						const categoryOption = interaction.options.get('categoryname');
						const categoryname = categoryOption?.value as string | undefined;

						const killfeedCategory = await interaction.guild?.channels.create({
							type: ChannelType.GuildCategory,
							name: categoryname ?? `${process.env.SERVER_NAME} | killfeed`,
							reason: 'Killfeed Channel Category',
							permissionOverwrites: [
								{
									id: interaction.guild?.roles.everyone,
									allow: ['ViewChannel', 'ReadMessageHistory'],
									deny: ['Administrator', 'SendMessages', 'CreatePublicThreads', 'CreatePrivateThreads']
								},
								{
									id: botID?.id,
									allow: ['SendMessages', 'AttachFiles', 'EmbedLinks', 'ManageChannels', 'ViewChannel'],
									deny: ['Administrator', 'SendTTSMessages']
								}
							]
						}) as CategoryChannel;

						const tbd = await interaction.guild?.channels.create({
							parent: killfeedCategory?.id,
							name: process.env.KILLFEED_NAME as string,
							reason: 'killfeed channel for dayz xbox game',
							permissionOverwrites: [
								{
									id: interaction.guild?.roles.everyone,
									allow: ['ViewChannel', 'ReadMessageHistory'],
									deny: ['Administrator', 'SendMessages', 'CreatePublicThreads', 'CreatePrivateThreads']
								},
								{
									id: botID?.id,
									allow: ['SendMessages', 'AttachFiles', 'EmbedLinks', 'ManageChannels', 'ViewChannel'],
									deny: ['Administrator', 'SendTTSMessages']
								}
							]
						});
						// Ensure tbd is not null before using its id
						const tbdId = tbd?.id || null;

						// Call channelMention with the tbdId if it's not null, or pass an empty string otherwise
						const tbdMention = tbdId ? channelMention(tbdId) : '';
						await interaction.reply({ content: `Killfeed Channel Created Successfully! ${channelMention(tbdMention)}`, ephemeral: true });
					} else {
						const tbd = await interaction.guild?.channels.create({
							name: process.env.KILLFEED_NAME as string,
							reason: 'killfeed channel for dayz xbox game',
							permissionOverwrites: [
								{
									id: interaction.guild?.roles.everyone,
									allow: ['ViewChannel', 'ReadMessageHistory'],
									deny: ['Administrator', 'SendMessages', 'CreatePublicThreads', 'CreatePrivateThreads']
								},
								{
									id: botID?.id,
									allow: ['SendMessages', 'AttachFiles', 'EmbedLinks', 'ManageChannels', 'ViewChannel'],
									deny: ['Administrator', 'SendTTSMessages']
								}
							]
						});
						// Ensure tbd is not null before using its id
						const tbdId = tbd?.id || null;

						// Call channelMention with the tbdId if it's not null, or pass an empty string otherwise
						const tbdMention = tbdId ? channelMention(tbdId) : '';
						await interaction.reply({ content: `Killfeed Channel Created Successfully! ${channelMention(tbdMention)}`, ephemeral: true });
					}
				} else {
					return interaction.reply({ content: 'Skipped Creating Killfeed Channel!', ephemeral: true })
						.catch((error) => { console.error(error); });
				}
			}
		}
		if (subCo === 'stop') {
			if(guildId) {
				if (guildId != GUILDID) return;
				if (feedStart != true) return interaction.reply({ content: 'THE KILLFEED IS NOT CURRENTLY RUNNING!.....', ephemeral: true })
					.catch((error) => { console.error(error); });
				await interaction.reply({ content: 'Terminating Project.....)', ephemeral: true })
					.catch((error) => { console.error(error); });
				setTimeout((() => { return process.exit(22); }), 5000);
			}
		}
		if (subCo === 'deathloc') {
			const guildId = interaction.guildId;
			if (guildId) {
				if (guildId != GUILDID) return;
				const choice = interaction.options.getString('state');
				if (feedStart !== true) {
					return interaction.reply({ content: 'THE KILLFEED IS NOT CURRENTLY RUNNING!.....', ephemeral: true })
						.catch((error) => { console.log(error); });
				}
				if (choice === 'on') {
					config.showLoc = 1;
					fs.writeFileSync('./src/config.ini', ini.stringify(config));
					interaction.reply({ content: 'Death Locations **Enabled!**', ephemeral: true })
						.catch((error) => { console.log(error); });
					return;
				} else if (choice === 'off') {
					config.showLoc = 0;
					fs.writeFileSync('./src/config.ini', ini.stringify(config));
					interaction.reply({ content: 'Death Locations **Disabled!**', ephemeral: true })
						.catch((error) => { console.log(error); });
					return;
				}
			}
		}
		if (subCo === 'start') {
			try {
				if(guildId) {
					if (guildId != GUILDID) return;
					const kfChannel = interaction.guild?.channels.cache.find(channel => channel.name.includes(process.env.KILLFEED_NAME as string));
					if (!kfChannel) return;
					const kfChannel1 = kfChannel.id;

					if (feedStart) return interaction.reply({ content: 'THE KILLFEED IS ALREADY RUNNING!.....TRY RESETING IF YOU NEED TO RESTART', ephemeral: true })
						.catch((error) => { console.error(error); });
					console.log('...working');
					await interaction.reply({ content: '**Starting Killfeed....**', ephemeral: true }).catch((error) => { console.log(error); });
					feedStart = true;
					await getDetails().catch((error) => {console.error(error);});


					async function getDetails() {
						tail.on('line', async (line: string) => {
							lineCount += 1;
							lineRef = lineCount;

							if (line.includes(phrase2, 0)) {
								logDt = line.slice(20, 30);
								console.log(`This is the logDate: ${logDt}`);
								console.log(`This is the current date: ${todayRef}`);
							}
						
							if (line.includes(phrase1, 0) || line.includes(phrase4, 0) || line.includes(phrase5, 0) || line.includes(phrase6, 0) || line.includes(phrase7, 0)) {
								const vRef = line;
								if (valueRef.has(`${vRef}`)) {
									return;
								}else {
									valueRef.add(vRef);
									iso = line.split(/[|"'<>()]/);
									// console.log(iso);
									if(iso) {
									//Handle Killfeed Data
										const methodVal = iso[iso.length - 1];
									
										if (iso[15]){
										//Check for range of kill in message
											if (methodVal.includes(phrase3)) {
												const f4 = methodVal.split(' ');
												const f5 = iso[7].toString();
												const f6 = iso[13].toString();
												const vLoc = f5.split(/[|" "<(),>]/), x1 = vLoc[0], y1 = vLoc[2], z1 = vLoc[4];
												const kLoc = f6.split(/[|" "<(),>]/), x2 = kLoc[0], y2 = kLoc[2], z2 = kLoc[4];
												const Vloc = x1.concat(`;${y1};${z1}`);
												const Kloc = x2.concat(';',y2,';',z2);
												const f0 = iso[0].toString();
												const f1 = iso[10].toString();
												const f2 = iso[2].toString();
												const f3 = methodVal;
												dt0 = Date.now();
												//Send Killfeed Notifications
												if (config.showLoc === 1) {
													const url = 'https://thecodegang.com';
													const link = hyperlink('Sign-up for DayZero', url);
													const attachment = new AttachmentBuilder('./assets/images/crown.png');
													const embed = new EmbedBuilder()
														.setColor('Blue')
														.setTitle(`${process.env.SERVER_NAME} Killfeed Notification`)
														.setThumbnail('attachment://crown.png')
														.setDescription(`${f0} **${f1}** Killed **${f2}** ${f3} `)
														.addFields({ name: '🌐', value: `${linkLoc+Vloc}`})
														.setFooter({ text: `Get Your Free Killfeed! ${link}` });
													const tbd = interaction.guild?.channels.cache.get(kfChannel1);
													if (tbd?.isTextBased()) await tbd.send({ embeds: [embed], files: [attachment] }).catch((err: Error) => { console.error(err); });
												}else {
													const url = 'https://thecodegang.com';
													const link = hyperlink('Sign-up for DayZero', url);
													const attachment = new AttachmentBuilder('./assets/images/crown.png');
													const embed = new EmbedBuilder()
														.setColor('Blue')
														.setTitle(`${process.env.SERVER_NAME} Killfeed Notification`)
														.setThumbnail('attachment://crown.png')
														.setDescription(`${f0} **${f1}** Killed **${f2}** ${f3} `)
														.setFooter({ text: `Get Your Free Killfeed! ${link}` });
													const tbd = interaction.guild?.channels.cache.get(kfChannel1);
													if (tbd?.isTextBased()) await tbd.send({ embeds: [embed], files: [attachment] }).catch((err: Error) => { console.error(err); });
												}
											
											}else {
												const f5 = iso[7].toString();
												const f6 = iso[13].toString();
												const vLoc = f5.split(/[|" "<(),>]/), x1 = vLoc[0], y1 = vLoc[2], z1 = vLoc[4];
												const kLoc = f6.split(/[|" "<(),>]/), x2 = kLoc[0], y2 = kLoc[2], z2 = kLoc[4];
												const Vloc = x1.concat(`;${y1};${z1}`);
												const Kloc = x2.concat(';',y2,';',z2);
												const f0 = iso[0].toString();
												const f1 = iso[10].toString();
												const f2 = iso[2].toString();
												const f3 = methodVal;
												dt0 = Date.now();
												//Send Killfeed Notifications To Discord
												if (config.showLoc === 1) {
													const url = 'https://thecodegang.com';
													const link = hyperlink('Sign-up for DayZero', url);
													const attachment = new AttachmentBuilder('./assets/images/crown.png');
													const embed = new EmbedBuilder()
														.setColor('Blue')
														.setTitle(`${process.env.SERVER_NAME} Killfeed Notification`)
														.setThumbnail('attachment://crown.png')
														.setDescription(`${f0} **${f1}** Killed **${f2}** ${f3} `)
														.addFields({  name: '🌐', value: `${linkLoc+Vloc}`})
														.setFooter({ text: `Get Your Free Killfeed! ${link}` })
														.setURL(link);
													const tbd = interaction.guild?.channels.cache.get(kfChannel1);
													if (tbd?.isTextBased()) await tbd.send({ embeds: [embed], files: [attachment] }).catch((err: Error) => { console.error(err); });
												}else {
													const url = 'https://thecodegang.com';
													const link = hyperlink('Sign-up for DayZero', url);
													const attachment = new AttachmentBuilder('./assets/images/crown.png');
													const embed = new EmbedBuilder()
														.setColor('Blue')
														.setTitle(`${process.env.SERVER_NAME} Killfeed Notification`)
														.setThumbnail('attachment://crown.png')
														.setDescription(`${f0} **${f1}** Killed **${f2}** ${f3} `)
														.setFooter({ text: `Get Your Free Killfeed! ${link}` });
													const tbd = interaction.guild?.channels.cache.get(kfChannel1);
													if (tbd?.isTextBased()) await tbd.send({ embeds: [embed], files: [attachment] }).catch((err: Error) => { console.error(err); });
												}
											}
										}else if (iso[13] && !iso[15]) {
											const f0 = iso[0].toString();
											const f1 = iso[8].toString();
											const f2 = iso[2].toString();
											const f3 = methodVal;
											dt0 = Date.now();
											//Player Vs NPC Kill
											// const attachment = new AttachmentBuilder('./assets/images/crown.png');
											// const embed = new MessageEmbed()
											// .setColor('0xDD0000')
											// .setTitle(`${SERVER_NAME} Killfeed Notification`)
											// .setThumbnail('attachment://crown.png')
											// .setDescription(`${f0} **${f1}** Killed **${f2}** ${f3} `)
											// const tbd = interaction.guild?.channels.cache.get(kfChannel1);
											// if (tbd?.isTextBased()) await tbd.send({ embeds: [embed], files: [attachment] }).catch((err: Error) => { console.error(err); });
											// .catch(function (error) {
											// 	console.log(error);
											// });
											console.log(`Kill Time-Stamp: ${dt} NPC KILL`);
										}else if (iso[9] && iso[9].includes('bled out')) {
											const f0 = iso[0].toString();
											const f1 = iso[2].toString();
											const f2 = iso[9].toString();
											dt0 = Date.now();
											//Send Killfeed Notification to Discord
											const url = 'https://thecodegang.com';
											const link = hyperlink('Sign-up for DayZero', url);
											const attachment = new AttachmentBuilder('./assets/images/crown.png');
											const embed = new EmbedBuilder()
												.setColor('Blue')
												.setTitle(`${process.env.SERVER_NAME} Killfeed Notification`)
												.setThumbnail('attachment://crown.png')
												.setDescription(`${f0} **${f1}** ${f2}`)
												.setFooter({ text: `Get Your Free Killfeed! ${link}` });
											const tbd = interaction.guild?.channels.cache.get(kfChannel1);
											if (tbd?.isTextBased()) await tbd.send({ embeds: [embed], files: [attachment] }).catch((err: Error) => { console.error(err); });
										}else if (iso[9] && iso[9].includes('hit by FallDamage')) {
											const f0 = iso[0].toString();
											const f1 = iso[2].toString();
											const f2 = 'fell to their death';
											dt0 = Date.now();
											//Send Killfeed Notification to Discord
											const url = 'https://thecodegang.com';
											const link = hyperlink('Sign-up for DayZero', url);
											const attachment = new AttachmentBuilder('./assets/images/crown.png');
											const embed = new EmbedBuilder()
												.setColor('Blue')
												.setTitle(`${process.env.SERVER_NAME} Killfeed Notification`)
												.setThumbnail('attachment://crown.png')
												.setDescription(`${f0} **${f1}** ${f2}`)
												.setFooter({ text: `Get Your Free Killfeed! ${link}` });
											const tbd = interaction.guild?.channels.cache.get(kfChannel1);
											if (tbd?.isTextBased()) await tbd.send({ embeds: [embed], files: [attachment] }).catch((err: Error) => { console.error(err); });
										}else if (iso[7] && iso[7].includes('suicide')) {
											const f0 = iso[0].toString();
											const f1 = iso[2].toString();
											const f2 = iso[7].toString();
											dt0 = Date.now();
											//Send Killfeed Notification to Discord
											const url = 'https://thecodegang.com';
											const link = hyperlink('Sign-up for DayZero', url);
											const attachment = new AttachmentBuilder('./assets/images/crown.png');
											const embed = new EmbedBuilder()
												.setColor('Blue')
												.setTitle(`${process.env.SERVER_NAME} Killfeed Notification`)
												.setThumbnail('attachment://crown.png')
												.setDescription(`${f0} **${f1}** ${f2}`)
												.setFooter({ text: `Get Your Free Killfeed! ${link}` });
											const tbd = interaction.guild?.channels.cache.get(kfChannel1);
											if (tbd?.isTextBased()) await tbd.send({ embeds: [embed], files: [attachment] }).catch((err: Error) => { console.error(err); });
										}
										else if (iso[7] && !iso[9]) {
											console.log('Stupid NPC\'s!');
										}else if (iso[5] && !iso[6]) {//committed suicide
											const f0 = iso[0].toString();
											const f1 = iso[2].toString();
											const f2 = methodVal;
											dt0 = Date.now();
											//Send Killfeed Notification to Discord
											const url = 'https://thecodegang.com';
											const link = hyperlink('Sign-up for DayZero', url);
											const attachment = new AttachmentBuilder('./assets/images/crown.png');
											const embed = new EmbedBuilder()
												.setColor('Blue')
												.setTitle(`${process.env.SERVER_NAME} Killfeed Notification`)
												.setThumbnail('attachment://crown.png')
												.setDescription(`${f0} **${f1}** ${methodVal}`)
												.setFooter({ text: `Get Your Free Killfeed! ${link}` });
											const tbd = interaction.guild?.channels.cache.get(kfChannel1);
											if (tbd?.isTextBased()) await tbd.send({ embeds: [embed], files: [attachment] }).catch((err: Error) => { console.error(err); });
										}
										// else if (line.includes(phrase8, 0)) {
										// 	const playerName = iso[2].toString();
										// 	dt0 = Date.now();
										// 	const joinEmbed = new EmbedBuilder()
										// 		.setColor('Blue')
										// 		.setTitle(`${process.env.SERVER_NAME} Player Joined`)
										// 		.addFields([
										// 			{
										// 				name: 'Connected',
										// 				value: `${dt0}`,
										// 				inline: false
										// 			},
										// 			{
										// 				name: 'gamertag',
										// 				value: `${playerName}`,
										// 				inline: true
										// 			},
										// 			{
										// 				name: 'action',
										// 				value: 'Connected',
										// 				inline: true
										// 			}
										// 		]);
										// Send the player join embed to the killfeed channel
										// 	const kfChannel = interaction.guild?.channels.cache.get(kfChannel1);
										// 	if (kfChannel?.isTextBased()) {
										// 		await kfChannel.send({ embeds: [joinEmbed] }).catch((err) => {
										// 			console.error(err);
										// 		});
										// 	}
										// } else if (line.includes(phrase9, 0)) {
										// 	const playerName = iso[2].toString();
										// 	const disconnectEmbed = new EmbedBuilder()
										// 		.setColor('Blue')
										// 		.setTitle(`${process.env.SERVER_NAME} Player Disconnected`)
										// 		.setDescription(`**${playerName} disconnected from the server**`);

										// 	dt0 = Date.now();
										// Send the player disconnect embed to the killfeed channel
										// 	const kfChannel = interaction.guild?.channels.cache.get(kfChannel1);
										// 	if (kfChannel?.isTextBased()) {
										// 		await kfChannel.send({ embeds: [disconnectEmbed] }).catch((err) => {
										// 			console.error(err);
										// 		});
										// 	}
										// }
										else {
											const f0 = iso[0].toString();
											const f1 = iso[2].toString();
											const f2 = iso[9].toString();
											dt0 = Date.now();
											//Send Killfeed Notification to Discord
											const url = 'https://thecodegang.com';
											const link = hyperlink('Sign-up for DayZero', url);
											const attachment = new AttachmentBuilder('./assets/images/crown.png');
											const embed = new EmbedBuilder()
												.setColor('Blue')
												.setTitle(`${process.env.SERVER_NAME} Killfeed Notification`)
												.setThumbnail('attachment://crown.png')
												.setDescription(`${f0} **${f1}** was ${f2}`)
												.setFooter({ text: `Get Your Free Killfeed! ${link}` });
											const tbd = interaction.guild?.channels.cache.get(kfChannel1);
											if (tbd?.isTextBased()) await tbd.send({ embeds: [embed], files: [attachment] }).catch((err: Error) => { console.error(err); });
										}
									}
								}
							}
						});
					
						tail.on('error', (err: Error) => {
							console.log(err);  
						});
					
						setInterval(async () => {
							if (parseInt(config.mapLoc) === 1) {
								linkLoc = 'https://www.izurvive.com/livonia/#location='; //LIVONIA
							}
							if (parseInt(config.mapLoc) === 0) {
								linkLoc = 'https://www.izurvive.com/#location='; //CHERNARUS
							}
							const REGION = process.env.REGION;
							if (REGION === 'Frankfurt' || REGION === 'FRANKFURT') {
								today = moment().tz('Europe/Berlin').format();
							}else if (REGION === 'Los_Angeles' || REGION === 'Los Angeles') {
								today = moment().tz('America/Los_Angeles').format();
							}else if (REGION === 'London' || REGION === 'LONDON') {
								today = moment().tz('Europe/London').format();
							}else if (REGION === 'Miami' || REGION === 'MIAMI') {
								today = moment().tz('America/New_York').format();
							}else if (REGION === 'New_York' || REGION === 'New York') {
								today = moment().tz('America/New_York').format();
							}else if (REGION === 'Singapore' || REGION === 'SINGAPORE') {
								today = moment().tz('Asia/Singapore').format();
							}else if (REGION === 'Sydney' || REGION === 'SYDNEY') {
								today = moment().tz('Australia/Sydney').format();
							}else if (REGION === 'Moscow' || REGION === 'MOSCOW') {
								today = moment().tz('Europe/Moscow').format();
							}
							todayRef = today.slice(0, 10);
							if (feedStart === true) {
								axios.get('https://api.nitrado.net/ping')
									.then((res) => {
										if(res.status >= 200 && res.status < 300) {// Ping Nitrado API For Response
											const PLATFORM = process.env.PLATFORM;
											if (process.env.PLATFORM == 'XBOX' || PLATFORM == 'Xbox' || PLATFORM =='xbox') {
												downloadFile().catch((error) => {console.log(error);});
												async function downloadFile () {
													// This function will request file that will contain download link for log
													const url1 = 'https://api.nitrado.net/services/';
													const url2 = '/gameservers/file_server/download?file=/games/';
													const url3 = '/noftp/dayzxb/config/DayZServer_X1_x64.ADM';
													const filePath = path.resolve('./src/logs', 'serverlog.ADM');
													const writer = fs.createWriteStream(filePath);
													const ID1 = process.env.ID1;
													const ID2 = process.env.ID2;
													const response = await axios.get(url1+`${ID1}`+url2+`${ID2}`+url3,{ responseType: 'stream',  headers: {'Authorization' : 'Bearer '+`${process.env.NITRATOKEN}`, 'Accept': 'application/octet-stream'}});
													response.data.pipe(writer);
													return new Promise((resolve, reject) => {
														writer.on('finish', resolve);
														writer.on('error', reject);
													});					
												}
											}else if (PLATFORM == 'PLAYSTATION' || PLATFORM == 'PS4' || PLATFORM == 'PS5' || PLATFORM == 'playstation' || PLATFORM == 'Playstation') {
												downloadFile().catch((error) => {console.log(error);});
												// eslint-disable-next-line no-inner-declarations
												async function downloadFile () {
													// This function will request file that will contain download link for log
													const url1 = 'https://api.nitrado.net/services/';
													const url2 = '/gameservers/file_server/download?file=/games/';
													const url3 = '/noftp/dayzps/config/DayZServer_PS4_x64.ADM';
													const filePath = path.resolve('./src/logs', 'serverlog.ADM');
													const ID1 = process.env.ID1;
													const ID2 = process.env.ID2;
													const writer = fs.createWriteStream(filePath);
													const response = await axios.get(url1+`${ID1}`+url2+`${ID2}`+url3,{ responseType: 'stream',  headers: {'Authorization' : 'Bearer '+`${process.env.NITRATOKEN}`, 'Accept': 'application/octet-stream'}});
													response.data.pipe(writer);
													return new Promise((resolve, reject) => {
														writer.on('finish', resolve);
														writer.on('error', reject);
													});					
												}
											}else {
												downloadFile().catch((error) => {console.log(error);});
												// eslint-disable-next-line no-inner-declarations
												async function downloadFile () {
													// This function will request file that will contain download link for log
													const url1 = 'https://api.nitrado.net/services/';
													const url2 = '/gameservers/file_server/download?file=/games/';
													const url3 = '/ftproot/dayzstandalone/config/DayZServer_x64.ADM';
													const filePath = path.resolve('./src/logs', 'serverlog.ADM');
													const writer = fs.createWriteStream(filePath);
													const ID1 = process.env.ID1;
													const ID2 = process.env.ID2;
													const response = await axios.get(url1+`${ID1}`+url2+`${ID2}`+url3,{ responseType: 'stream',  headers: {'Authorization' : 'Bearer '+`${process.env.NITRATOKEN}`, 'Accept': 'application/octet-stream'}});
													response.data.pipe(writer);
													return new Promise((resolve, reject) => {
														writer.on('finish', resolve);
														writer.on('error', reject);
													});					
												}
											}
										}else {
											console.log(res);
										}
									})
									.catch((error) => { console.error(error); });
								// Create a readable stream in order to parse log download link form file
								const rl = readline.createInterface({ input: fs.createReadStream('./src/logs/serverlog.ADM') });

								//Handle Stream events ---> data, end, and error// This will request download link and write result to new file
								rl.on('line', (line: string) => {
									const URLParse = line.split(/[|"'<>()]/);
									const newURL = URLParse[11];
									// console.log(newURL);
									axios.get(newURL)
										.then((res) => {
											const _log = res.data;
											fs.writeFile('./src/logs/log.ADM', _log, 'utf-8', (err) =>{
												if (err) throw err;
												console.log('Log Saved!');
											});				
										})
										.catch((error) => { console.error(error); });			
								});
							
								rl.on('close', (line: string) => { return line; });
					
								rl.on('error', (err: Error) => { console.error(err.stack); });

								//reset lineCount
								lineCount = 0;

								//Check Log File Size
								logStats = fs.statSync('./src/logs/log.ADM');
								logBytes = logStats.size;
								logSize = logBytes / 1000000.0;
								console.log(`Current Log Size: ${logSize} / LogRef Size: ${logSizeRef}\nCurrent LineRef: ${lineRef}`);
								if (logSize < logSizeRef) {
									setTimeout((() => {
										logSizeRef = 0;
										valueRef.clear();
									}), 40000);
								}else {
									logSizeRef = logSize;
								}
							}else {
							// interaction.guild.channels.cache.get(`${kfChannel.id}`).send('**K1llfeed Paused....**');
								const tbd = interaction.guild?.channels.cache.get(kfChannel1);
								if (tbd?.isTextBased()) await tbd.send({ content: '**K1llfeed Paused....**' }).catch((err: Error) => { console.error(err); });
								return;
							}
						}, 300000);
					}
				}
			} catch (error) {
				console.error(error);
			}
		}
	}
});