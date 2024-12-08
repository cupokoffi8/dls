global.ReadableStream = require("web-streams-polyfill").ReadableStream;
require("dotenv").config();
const { Client, GatewayIntentBits, ChannelType } = require("discord.js");
const express = require("express");
const cron = require("cron");

// Create a new Express app
const app = express();
const port = process.env.PORT || 3000;

const CHANNEL_ID = "785014089801793539"; // Replace with your channel ID
const token = process.env.TOKEN;

// Create a new Discord client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Track the last message time for each server
const lastMessageTimes = new Map();

// Bot login
client.login(token);

// When the bot is ready
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  scheduleDailyMessages();
  setInterval(checkForSilence, 60 * 1000); // Check for silence every minute
});

// On message creation
client.on("messageCreate", (message) => {
  if (message.author.bot) return; // Ignore bot messages

  // Update the last message time for the guild
  lastMessageTimes.set(message.guild.id, Date.now());

  // Respond if the bot is mentioned (@bot_name)
  if (message.mentions.has(client.user)) {
    sendRandomMentionResponse(message);
  }
});

// Function to check for silence
function checkForSilence() {
  const now = Date.now();

  lastMessageTimes.forEach((lastTime, guildId) => {
    if (now - lastTime >= 30 * 60 * 1000) { // Check for 30 minutes of silence
      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        console.log(`Guild with ID ${guildId} not found.`);
        return;
      }

      const defaultChannel =
        guild.systemChannel ||
        guild.channels.cache.find(
          (channel) =>
            channel.type === ChannelType.GuildText &&
            channel.permissionsFor(guild.members.me).has("SendMessages")
        );

      if (defaultChannel) {
        console.log(`Sending "AWKWARD SILENCE" to guild: ${guild.name}`);
        defaultChannel.send("AWKWARD SILENCE 😬");
        lastMessageTimes.set(guildId, now); // Reset last message time
      } else {
        console.log(`No accessible channel found in guild: ${guild.name}`);
      }
    }
  });
}

// Function to send a random response when the bot is mentioned
function sendRandomMentionResponse(message) {
  const randomResponses = [
    "Who let bro cook?",
    "OH FUCK [bleep out and censor fuck]",
    "Is this satire? 🤔",
    "This is lowkey Bridgerton-coded",
    "ZOINKS SCOOB",
    "Oooo right in the feels",
    "Oooo right in the CHILDHOOD",
    "My diaper is so full",
    "I am so hard rn",
    "Emotional damage",
    "Do you need a light?",
    "Virginia! Hanging out I see",
    "Go. you. ✊",
    "I can't breathe",
    "Goku likes 2 b naked when he takes a dump?",
    "Goku’s probably proud of you right now.",
    "Nice cock",
    "Ball delivery",
    "Obama hammer",
    "Tickle my nono",
    "Mah boi, this peace is what all true warriors strive for!",
    "TOASTERS! Toast toast toast toast!",
    "I hope she made lotsa spaghetti!",
    "Snooping as usual I see",
    "This is a certified hood classic.",
    "Luigi, look! It's from Bowser! Dear pesky plumbers...",
    "My name is Jeff.",
    "My LEG!",
    "I’m firing my laser! BLAAAAARGH!",
    "You dare bring light into my lair? YOU MUST DIE! …but first, let me finish my sandwich.",
    "I see your Schwartz is as big as mine!",
    "What’s the matter, Nazi Sanders? SHISH?!",
    "Let's Shit!",
    "You'll never let go of your ass.",
    "I'd Like to Bone Esmeralda!",
    "I may be an idiot, but I’m an idiot.",
    "Do you believe in life after bot? 🤖🎶",
    "Certified hood classic. 🕶️",
    "BZZZZ…processing 🦾"
  ];

  const randomResponse =
    randomResponses[Math.floor(Math.random() * randomResponses.length)];

  console.log(`Bot mentioned: Responding with "${randomResponse}"`);
  message.reply(randomResponse);
}

// Send "Good morning" and "Good night" messages
function sendGoodMorningMessage() {
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (channel) {
    console.log("Sending 'Good morning' message.");
    channel.send("Good morning sisters ☀️");
  } else {
    console.log("Good morning channel not found.");
  }
}

function sendGoodNightMessage() {
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (channel) {
    console.log("Sending 'Good night' message.");
    channel.send("Good night sisters 🌙");
  } else {
    console.log("Good night channel not found.");
  }
}

// Schedule daily messages
function scheduleDailyMessages() {
  const morningJob = new cron.CronJob(
    "5 8 * * *", // 8:05 AM
    sendGoodMorningMessage,
    null,
    true,
    "America/New_York"
  );
  morningJob.start();

  const nightJob = new cron.CronJob(
    "0 22 * * *", // 10:00 PM
    sendGoodNightMessage,
    null,
    true,
    "America/New_York"
  );
  nightJob.start();
}

// Health check route
app.get("/", (req, res) => {
  const now = new Date();
  const formattedDate = now.toLocaleString();
  res.send(`Bot is running<br>Current date and time: ${formattedDate}`);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
