const Discord = require('discord.js');

module.exports = {  
    name: 'move',
    aliases: ['movemessage', 'moveto'],
    description: 'Moves a message from one channel to another',
    usage: '<MESSAGE_ID> <TO_CHANNEL_TAG>',
    hidden:true,
    admin: true,
    rawArgs: true,
    args: true,
  
    run : async (message, args) => {     
        //permissions and sanity checks   
        if (!message.guild.me.permissions.has('MANAGE_CHANNELS')) {
			message.channel.send('This bot uses webhooks. I need at least Manage Channels permission in order to work with them.');
			return;
		}
		if (!message.member.permissions.has('MANAGE_MESSAGES')) {
			message.channel.send('You need at least Manage Messages permission in order to use this command');
			return;
		}
		if (args.length < 2) {
			message.channel.send('Usage: `' + config.prefix + 'move <Channel to send to> <Message ID to move> [Channel where the message is from]`');
			return;
		}

        //Determine the 'to' channel
        Discord.MessageMentions.CHANNELS_PATTERN.lastIndex = 0;
		if (!Discord.MessageMentions.CHANNELS_PATTERN.test(args[1])) {
			message.channel.send('Invalid channel specified');
			return;
		}
		const toChannel = message.guild.channels.cache.get(args[1].replace(/<#|>/g, '')); // Makes it easier to get the channels rather than doing the msg.mentions.channels thing
		if (!toChannel) {
			message.channel.send('Could not find mentioned channel');
			return;
		}
		if (toChannel.type !== 'text') {
			message.channel.send('Mentioned channel is not a text channel');
			return;
		}

		/*if (!toChannel.permissionsFor(message.member).has('SEND_MESSAGES')) { // This isn't fully tested and I am too lazy to test it. Uncomment if you want.
			message.channel.send('You cannot move a message to a channel you cannot send messages to yourself');
			return;
		}*/

        //Determine the 'from' channel
		const fromChannel = message.channel;
		if (args[2]) {
			fromChannel = message.guild.channels.cache.get(args[2].replace(/<#|>/g, '')); // Makes it easier to get the channels rather than doing the msg.mentions.channels thing
			if (!fromChannel || fromChannel.type !== 'text') fromChannel = message.channel;
		}

		const statusMessage = await message.channel.send('Moving message...');

		fromChannel.messages.fetch(args[0]).then(async (messageToMove) => {
			var channelWebhooks = await toChannel.fetchWebhooks();
			if (channelWebhooks.size < 1) {
                var webhook = await toChannel.createWebhook('Move Message');
            }
			else var webhook = channelWebhooks.first();

			webhook.send(messageToMove.content || '', { 
                username: messageToMove.author.tag, 
                avatarURL: messageToMove.author.avatarURL(), 
                embeds: messageToMove.embeds, 
                files: messageToMove.attachments.array() 
            }).then(() => {
				statusMessage.edit('Moved message from user ' + Discord.Util.escapeMarkdown(message.author.tag) + ' from ' + fromChannel.toString() + ' to ' + toChannel.toString());
                messageToMove.delete();
			}).catch((e) => {
				statusMessage.edit(e.message || 'Unknown Error');
			})
		}).catch((e) => {
			statusMessage.edit(e.message || 'Unknown Error');
		});     
    }
}