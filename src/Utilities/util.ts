import axios from 'axios';

export function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getServerDetails() {
	try {
		const response: NitradoResponse = await axios.get(
			`https://api.nitrado.net/services/${process.env.ID1}/gameservers`,
			{
				headers: {
					Authorization: `Bearer ${process.env.NITRATOKEN}`,
					Accept: 'application/json',
				},
			}
		);

		const gameServer: NitradoResponse = response.data.gameserver;
		const query = gameServer.query;
		const ServerStatus = gameServer.status;
		const onlinePlayers = query.player_current;
		const slots = gameServer.slots;
		const serverTitle = query.server_name;
		const Map = query.map;
		const Version = query.version;

		return { onlinePlayers, slots, serverTitle, Map, Version, ServerStatus };
	} catch (error) {
		console.error('Error fetching server data from Nitrado API:', error);
		return null;
	}
}

export interface NitradoResponse {
  data: {
    gameServer: GameServer;
  };
}

interface GameServer {
  status: 'started';
  last_status_change: number;
  must_be_started: boolean;
  websocket_token: string;
  hostsystems: {
    linux: any; // You might want to create a specific interface for the `linux` object
    windows: any; // You might want to create a specific interface for the `windows` object
  };
  username: string;
  user_id: number;
  service_id: number;
  location_id: number;
  minecraft_mode: boolean;
  ip: string;
  ipv6: null | string; // Nullable type for ipv6
  port: number;
  query_port: number;
  rcon_port: number;
  label: string;
  type: 'Gameserver';
  memory: 'Standard'; // You might want to create a specific union type for memory options
  memory_mb: number;
  game: string;
  game_human: string;
  game_specific: {
    path: string;
    update_status: string;
    last_update: null | string; // Nullable type for last_update
    path_available: boolean;
    features: any; // You might want to create a specific interface for the `features` object
    log_files: any[]; // You might want to create a specific interface for the `log_files` array
    config_files: any[]; // You might want to create a specific interface for the `config_files` array
    curseforge_customer_settings: null; // Nullable type for curseforge_customer_settings
  };
  modpacks: any; // You might want to create a specific interface for the `modpacks` object
  slots: number;
  location: string;
  credentials: {
    ftp: any; // You might want to create a specific interface for the `ftp` object
    mysql: any; // You might want to create a specific interface for the `mysql` object
  };
  settings: {
    config: any; // You might want to create a specific interface for the `config` object
    general: any; // You might want to create a specific interface for the `general` object
  };
  quota: null; // Nullable type for quota
  query: {
    server_name: string;
    connect_ip: string;
    map: string;
    version: string;
    player_current: number;
    player_max: number;
    players: any[]; // You might want to create a specific interface for the `players` array
  };
}