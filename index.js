const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');

// Crea una nueva instancia del cliente de Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Cola de música y estado de reproducción
let musicQueue = [];
let isPlaying = false;
let player = createAudioPlayer();
let currentResource = null;  // Para rastrear la canción que se está reproduciendo

client.once('ready', () => {
    console.log('Bot listo!');
});

// Comando para unirse al canal de voz
client.on('messageCreate', async message => {
    if (message.content.startsWith('!join')) {
        if (message.member.voice.channel) {
            joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
            message.reply('Me uní al canal de voz!');
        } else {
            message.reply('Necesitas estar en un canal de voz para que me una!');
        }
    }
});

// Comando para agregar música a la cola y reproducirla
client.on('messageCreate', async message => {
    if (message.content.startsWith('!play')) {
        const args = message.content.split(' ');
        const fileNameWithoutExtension = args[1];

        const filePath = path.join(__dirname, 'music', `${fileNameWithoutExtension}.mp3`);

        if (!fs.existsSync(filePath)) {
            return message.reply(`El archivo ${fileNameWithoutExtension}.mp3 no existe.`);
        }

        musicQueue.push(filePath);
        message.reply(`Añadido a la cola: ${fileNameWithoutExtension}.mp3`);

        if (!isPlaying) {
            playNextInQueue(message);
        }
    }
});

// Comando para pausar la música
client.on('messageCreate', async message => {
    if (message.content.startsWith('!pausec')) {
        if (player.state.status === AudioPlayerStatus.Playing) {
            player.pause(true); // true garantiza que se pausa inmediatamente
            message.reply('La música ha sido pausada.');
        } else {
            message.reply('No hay música en reproducción para pausar.');
        }
    }
});

// Comando para reanudar la música
client.on('messageCreate', async message => {
    if (message.content.startsWith('!playc')) {
        if (player.state.status === AudioPlayerStatus.Paused) {
            player.unpause();
            message.reply('La música ha sido reanudada.');
        } else {
            message.reply('No hay música pausada para reanudar.');
        }
    }
});

// Función para reproducir la siguiente canción en la cola
async function playNextInQueue(message) {
    if (musicQueue.length === 0) {
        isPlaying = false;
        return;
    }

    isPlaying = true;
    const filePath = musicQueue.shift();  // Quita la primera canción de la cola

    const connection = getVoiceConnection(message.guild.id);
    currentResource = createAudioResource(filePath);

    player.play(currentResource);
    connection.subscribe(player);

    player.once(AudioPlayerStatus.Idle, () => {
        isPlaying = false;
        playNextInQueue(message);  // Reproduce la siguiente canción cuando termine la actual
    });

    player.once('error', error => {
        console.error(`Error en la reproducción: ${error.message}`);
        isPlaying = false;
        playNextInQueue(message);
    });

    message.channel.send(`Reproduciendo: ${path.basename(filePath)}`);
}

// Comando para salir del canal de voz y limpiar la cola
client.on('messageCreate', async message => {
    if (message.content.startsWith('!leave')) {
        const connection = getVoiceConnection(message.guild.id);
        if (connection) {
            connection.destroy();
            musicQueue = [];  // Limpiar la cola de reproducción
            isPlaying = false;
            player.stop();  // Detiene cualquier reproducción en curso
            message.reply('Salí del canal de voz y limpié la cola de música!');
        } else {
            message.reply('No estoy en un canal de voz!');
        }
    }
});


// Inicia sesión con el token de tu bot
client.login(
    "MTI3MTgzMjc3NTgxMjU3OTM4OA.G6Gq_1.uTRl41HZgiZ8ii65W6Jz4auz_HbMk2ufcgtT_Q",
);
