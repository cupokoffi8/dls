global.ReadableStream = require('web-streams-polyfill').ReadableStream;
require('dotenv').config();
const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const cron = require("cron");

// Create a new Express app
const app = express();

// Set the port
const port = process.env.PORT || 3000;

// Your channel ID (replace with the channel where you want the bot to send messages)
const CHANNEL_ID = "785014089801793539";
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

let lastRespondedMessageId = null;

// Log the bot in
client.login(token);

// When the bot is ready, print a message to the console
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Schedule daily messages using cron
  scheduleDailyMessages();
});

client.on("messageCreate", (message) => {
  // Ignore messages from the bot itself
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // Respond to variations of "Can I get a what what?"
  if (content.includes("can i get a what what") && message.id !== lastRespondedMessageId) {
    message.channel.send("WHAT WHAT");
    lastRespondedMessageId = message.id;
    return;
  }

  // Respond to variations of "Can I get a hip hip hooray?" or "Can I get a hip-hip hooray?"
  if (
    (/\bcan i get a hip[-\s]?hip hooray\b/i.test(message.content)) &&
    message.id !== lastRespondedMessageId
  ) {
    message.channel.send("HIP HIP HOORAY");
    lastRespondedMessageId = message.id;
    return;
  }

  // Respond if the bot is mentioned and the message contains "hi"
  if (message.mentions.has(client.user) && /\bhi\b/i.test(content)) {
    message.reply("Hello! 👋");
  }
});

// Function to send "Good morning" and "Good night" messages
function sendGoodMorningMessage() {
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (channel) {
    channel.send("Good morning sisters ☀️");
  }
}

function sendGoodNightMessage() {
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (channel) {
    channel.send("Good night sisters 🌙");
  }
}

// Schedule Good Morning at 8:05 AM every day
function scheduleDailyMessages() {
  // Schedule "Good Morning" at 8:05 AM
  const morningJob = new cron.CronJob(
    "5 8 * * *",
    sendGoodMorningMessage,
    null,
    true,
    "America/New_York",
  );
  morningJob.start();

  // Schedule "Good Night" at 10:00 PM every day
  const nightJob = new cron.CronJob(
    "45 21 * * *",
    sendGoodNightMessage,
    null,
    true,
    "America/New_York",
  );
  nightJob.start();
}

// Set up an Express route to check if the bot is alive
app.get("/", (req, res) => {
  res.send("Bot is running");
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
