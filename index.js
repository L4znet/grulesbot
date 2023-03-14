const { Client, GatewayIntentBits } = require('discord.js')
const fs = require("fs");

require('dotenv').config()
const token = process.env.TOKEN
const client = new Client({ intents: [ 
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent] });


const getRules = JSON.parse(fs.readFileSync("./rules.json"));
const aymericId = "208262462942871553";
const macsimId = "350663282383912970";
const {createClient} = require('redis')
const cron = require("node-cron");
const nothingGif = "https://tenor.com/b15s2.gif"
const options = {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    },
    formatter = new Intl.DateTimeFormat([], options);

const regex1 = new RegExp(/https?:\/\/(.)+/g);
const redisClient = createClient({
    username:process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: 17356
    }
});

const whitelist = ["https://media.discordapp.net", "https://tenor.com"]


client.on('ready', async () => {

    await redisClient.connect()

    const toggleAumericCounterState = async (value) => {
        await redisClient.set('firstAymericMessageSent', value);
    }
    const getAymericCounterState = async () => {
        return await redisClient.get('firstAymericMessageSent');
    }

    const getRule = (ruleNumber) => {

       const rule = getRules.rules.filter(rule => rule.ruleNumber === parseInt(ruleNumber));

        if(rule[0] !== undefined){
            return "```["+ rule[0].ruleNumber +"] - " + rule[0].text + "```"
        } else {
            return 404
        }

    }


    cron.schedule('0 0 * * *', async () => {
        toggleAumericCounterState(false)
    });


    client.on("messageCreate", (message) => {

        // Si quelqu'un écrit "Y'a rien" on envoi le gif
        if (message.content.toLowerCase() === "y'a rien" || message.content.toLowerCase() === "y a rien") {
            message.reply(nothingGif)

            // Et si ce quelqu'un est macsim, on envoi évidemment, la rule qui va bien
            if (message.author.id === macsimId) {
                message.reply(getRule(11))
            }
        }

        // Ici on invoque une rule en fonction de son numéro
        if (message.content.startsWith("/grules")) {
            const ruleNumber = message.content.match(/(\/grules) ([0-9]?[0-9]?[0-9]?[0-9]?[0-9])/)

            if(ruleNumber !== null){
                if(getRule(ruleNumber[2]) === 404){
                    message.reply("Cette rule n'existe pas")
                } else {
                    message.reply(getRule(ruleNumber[2]))
                }
            } else {
                message.reply("Vous n'avez pas saisi un numéro de rule valide :(")
            }
        }

        // Si Aymeric envoi un message
        if (message.author.id === aymericId) {

            // Si Aymeric n'a pas encore envoyé son premier message
            if (!getAymericCounterState()) {
                toggleAumericCounterState(true) // On passe le state à true, et on dit qu'Aymeric est hyper sus.
                message.reply("Mec t'es sus")
            }

            // Si Aymeric envoi un lien, on rappel la rule 1 !
            if (message.content.match(regex1)) {

                console.log(whitelist.filter(whiteListItem => whiteListItem.startsWith(message.content)))

            /*    if(!message.content.startsWith('https://tenor.com')){
                    message.reply(getRule(1))
                }*/
            }
        }
    });
});

client.login(token);
