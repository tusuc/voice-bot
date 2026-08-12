require('http').createServer((req, res) => res.end('Bot is running!')).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// CONFIGURATION
const TOKEN = process.env.TOKEN;
const GUILD_ID = '1338167368941309982';
const CHANNEL_ID = '1532533521745182985';

let connection = null;

client.once('ready', () => {
    console.log(`Logged in successfully as ${client.user.tag}`);
    connectToVoice();
});

function connectToVoice() {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return console.log('Guild not found.');

    connection = joinVoiceChannel({
        channelId: CHANNEL_ID,
        guildId: GUILD_ID,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: false
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
        } catch (error) {
            if (connection) connection.destroy();
            console.log('Bot was disconnected or kicked. Reconnecting in 1 second...');
            setTimeout(connectToVoice, 1000);
        }
    });
}

client.on('voiceStateUpdate', (oldState, newState) => {
    if (newState.id === client.user.id) {
        if (!newState.channelId || newState.channelId !== CHANNEL_ID) {
            console.log('Bot voice state changed or moved. Returning to target channel...');
            setTimeout(connectToVoice, 1000);
        }
    }
});

client.login(TOKEN);
