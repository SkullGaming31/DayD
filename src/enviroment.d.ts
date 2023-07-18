declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DISCORD_GUILD_ID: string;
      DISCORD_BOT_TOKEN: string;
      DISCORD_CLIENT_ID: string;
      DISCORD_CLIENT_SECRET: string;
      DISCORD_NOW_LIVE_CHANNEL: string;
      Environment: 'dev' | 'prod' | 'debug';
      PORT: number;
      MONGO_USERNAME: string;
      MONGO_PASSWORD: string;
      MONGODB_DATABASE: string;
      MONGO_DATABASE_URI: string;
			DEV_MONGO_DATABASE_URI: string;
			DEV_MONGO_DATABASE_USERNAME: string;
			DEV_MONGO_DATABSE_PASSWORD: string;
			DEV_MONGO_DATABSE_NAME: string;
      SESSION_SECRET: string;
      OAUTH_CLIENT_ID: string;
      OAUTH_CLIENT_SECRET: string;
      OAUTH_REDIRECT_URL: string;
      DEV_DASHBOARD_DOMAIN: string;
      DASHBOARD_DOMAIN: string;
      GITHUB_PERSONAL_ACCESS_TOKEN: string;
      PLATFORM: 'XBOX' | 'Xbox' | 'xbox' | 'PLAYSTATION' | 'Playstation' | 'playstation' | 'PS4' | 'PS5';
      ID1: string;
      ID2: string;
      NITRATOKEN: string;
      REGION: 'Frankfurt' | 'FRANKFURT' | 'Los_Angeles' | 'Los Angeles' | 'London' | 'LONDON' | 'Miami' | 'MIAMI' | 'New_York' | 'New York' | 'Singapore' | 'SINGAPORE' | 'Sydney' | 'SYDNEY' | 'Moscow' | 'MOSCOW';
      KILLFEED_PARENT_CHANNEL_ID: string
      KILLFEED_NAME: string;
      SERVER_NAME: string;
    }
  }
}

export { };
