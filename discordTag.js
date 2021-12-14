const   { Client, Intents, MessageEmbed, MessageAttachment } = require('discord.js'),
        client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] }),
        fs = require('fs'),
		{ createCanvas, loadImage, registerFont } = require('canvas');

const config = {
        token: "your bot token",
        prefix: "/",
        adminID: "admin id",
        embed_color: "#ffffff"
    };

client.db = require("quick.db");

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
	if (client.db.get(`members`) == null) client.db.set(`members`, {});
	const user_id = config.adminID;
	const member = client.db.get(`members.user_${user_id}`);
	if (member == null || member == undefined) {
		var u = {};
		u.id = user_id;
		u.lvl = 1;
		u.exp = 0;
		u.background = "";
		u.status = "";
		client.db.set(`members.user_${user_id}`, u);
	}
});

client.on('messageCreate', async (message) => {

    if (!message.content.startsWith(config.prefix)) return;
	
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift();

    if ([`profile`, `lelel`, `lvl`, `exp`].includes(command)) {
        let mention = message.mentions.members.first();
        const member = mention ? mention: message.member;
        drawProfile(member)
            .then(() => {
                const file = new MessageAttachment(`./profiles/${member.id}.png`);
                const embed = new MessageEmbed()
                    .setColor(config.embed_color)
                    .setDescription(`${member}`)
                    .setImage(`attachment://${member.id}.png`);
                message.reply({
                    embeds: [embed],
                    files: [file]
                });
            })
            .catch((err) => {
                message.reply(`Ошибка\n> ${err}`);
            });
    }
});

function drawProfile(member) {
    return new Promise(async (resolve, reject) => {
		if (member == undefined) reject(`**member** not specified`);
        const user_id = member.id;

        // user db profile
        const u = getProfile(user_id);
        let bg = `./background.png`, 
            av = './avatar.png';
        if (![undefined, ``].includes(u.background)) bg = u.background;
        if (member.user.avatarURL({ format: "jpg" }) != null && member.user.avatarURL({ format: "jpg" }) != undefined) {
            av = member.user.avatarURL({ format: "jpg" });
        }

        let imageBg, imageOverlay, imageAvatar;
        try {
            // Check last update date
            if (fs.existsSync(`./profiles/${user_id}.png`)) {
                fs.stat(`./profiles/${user_id}.png`, function(err, stats) {
                    var date = new Date(stats["mtime"]);
                    if (timeDifference(date, Date.now()) < 10) {
                        resolve(true);
                    }
                });                
            }
            // load overlays
            imageBg = await loadImage(bg);
            imageOverlay = await loadImage('./overlay.png');
            imageAvatar = await loadImage(av);
        } catch (err) {
            reject(err)
        }

        // Main Canvas
        const canvas = createCanvas(400, 200);
        const context = canvas.getContext('2d');
        context.fillStyle = '#000';
        context.fillRect(0, 0, 400, 200);

        // Bacground & Overlay
        context.drawImage(imageBg, 0, 0, 400, 200);
        context.drawImage(imageOverlay, 0, 0, 400, 200);
        
        // Avatar Canvas
        const canvasAvatar = createCanvas(98, 98);
        const contextAvatar = canvasAvatar.getContext('2d');
        contextAvatar.beginPath();
        contextAvatar.arc(98/2, 98/2, 98 / 2, 0, Math.PI * 2, true); // circle center [x, y], radius
        contextAvatar.closePath();
        contextAvatar.clip();
        contextAvatar.drawImage(imageAvatar, 0, 0, 98, 98);
        contextAvatar.strokeStyle = "#000";
        contextAvatar.stroke();
        context.drawImage(canvasAvatar, 22, 67, 98, 98);

        // Shapes
        const canvasTriangle = createCanvas(98, 98);
        const contextTriangle = canvasTriangle.getContext('2d');
        contextTriangle.fillStyle = '#fff';
        contextTriangle.beginPath();
        contextTriangle.moveTo(98, 98 / 2);
        contextTriangle.lineTo(0, 0);
        contextTriangle.lineTo(0, 98);
        contextTriangle.closePath();
        contextTriangle.fill();
        context.drawImage(canvasTriangle, 22, 20, 20, 20);

        // User name
        registerFont('./10568.ttf', { family: 'Astakhov' });
        context.font = '24pt Astakhov';
        const title = member.nickname ? member.nickname: member.user.username;
        context.font = '24pt Astakhov';
        context.fillStyle = '#000';
        context.fillText(title, 50, 48);
        context.fillStyle = '#fff';
        context.fillText(title, 48, 46);

        // Other text fields
        const lvl = `${u.lvl} LVL`;
        context.font = '10pt Astakhov';
        context.textAlign = 'center';
        context.fillStyle = '#000';
        context.fillText(lvl, 73, 185);
        context.fillStyle = '#fff';
        context.fillText(lvl, 71, 183);

        // Exp text
        let u_exp = u.exp;
        u_exp = Math.random() * 1000; // TODO Remove debug
        const exp = `${(u_exp/100).toFixed(1).replace(".0", "")}k/10k EXP`;
        context.textAlign = 'right';
        context.fillStyle = '#000';
        context.fillText(exp, 375, 185);
        context.fillStyle = '#fff';
        context.fillText(exp, 373, 183);
        // Exp line
        const gradientWR = context.createLinearGradient(0, 0, 389, 0);
        gradientWR.addColorStop(0, "white");
        gradientWR.addColorStop(1, "red");
        context.fillStyle = gradientWR;
        context.fillRect(5, 188, Math.round((u_exp*389)/1000), 5);
        // context.fillText(exp, 373, 183);

        // Other text calculating
        const randomText = generateRandomString();
        let fontsize = 20;
        do {
            fontsize--;
            context.font = `${fontsize}px Astakhov`;
        } while (context.measureText(randomText).width > 215)
        context.textAlign = 'center';
        context.fillStyle = '#000';
        context.fillText(randomText, 268, 90);
        context.fillStyle = '#fff';
        context.fillText(randomText, 266, 88);

        // Dynamic drawing [https://flaviocopes.com/canvas/]
        const canvasRainbow = createCanvas(400, 200);
        const contextRainbow = canvasRainbow.getContext('2d');
        for (let i = 0; i < canvasRainbow.height/5+1; i++) {
            for (let j = 0; j < canvasRainbow.width/5+1; j++) {
                contextRainbow.fillStyle = `rgb(${i * 5}, ${j * 5}, ${(i+j) * 50})`
                contextRainbow.fillRect(j * 5, i * 5, 5, 5)
            }
        }          
        // context.drawImage(canvasRainbow, 0, 0, 400, 200);
        
        // Export
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(`./profiles/${user_id}.png`, buffer);
        resolve();
	});
}

function getProfile(user_id) {
    const member = client.db.get(`members.user_${user_id}`);

    if (member == null || member == undefined) {
        var u = {};
        u.id = user_id;
        u.lvl = 1;
        u.exp = 0;
        u.background = "";
        u.status = "";

        client.db.set(`members.user_${user_id}`, u);
        return u;
    }

    return member;
}

function timeDifference(timestamp1, timestamp2) {
    var date1 = new Date();
    date1.setTime(timestamp1);
    var date2 = new Date();
    date2.setTime(timestamp2);

    var difference = date1.getTime() - date2.getTime();

    var daysDifference = Math.floor(difference/1000/60/60/24);
    difference -= daysDifference*1000*60*60*24

    var hoursDifference = Math.floor(difference/1000/60/60);
    difference -= hoursDifference*1000*60*60

    var minutesDifference = Math.floor(difference/1000/60);

    return Math.abs(minutesDifference);
}

function generateRandomString() {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < (Math.random() * (100 - 20) + 20); i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

client.login(config.token);
