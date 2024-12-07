global.ReadableStream = require("web-streams-polyfill").ReadableStream;
require("dotenv").config();
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

// A map to track the last message time for each guild
const lastMessageTimes = new Map();

let lastRespondedMessageId = null;

// Log the bot in
client.login(token);

// When the bot is ready, print a message to the console
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Schedule daily messages using cron
  scheduleDailyMessages();

  // Check for silence every minute
  setInterval(checkForSilence, 60 * 1000);
});

// Track when the last message was sent in the server
client.on("messageCreate", (message) => {
  // Ignore messages from the bot itself
  if (message.author.bot) return;

  // Update the last message time for the guild
  lastMessageTimes.set(message.guild.id, Date.now());

  // Normalize and log the message content
  const content = message.content.trim().toLowerCase();
  console.log(`Received message: "${content}" from ${message.author.tag}`);

  // Respond to "Can I get a what what?"
  if (/\bcan i get a what what\b/.test(content) && message.id !== lastRespondedMessageId) {
    console.log("Responding to 'Can I get a what what'");
    message.channel.send("WHAT WHAT");
    lastRespondedMessageId = message.id;
    return;
  }

  // Respond to "Can I get a hip hip hooray?" (allowing additional words in between)
  if (
    /\bcan i .*?hip[-\s]?hip.*?hooray\b/i.test(content) &&
    message.id !== lastRespondedMessageId
  ) {
    console.log("Responding to 'Can I get a hip hip hooray'");
    message.channel.send("HIP HIP HOORAY");
    lastRespondedMessageId = message.id;
    return;
  }
});

// Function to check for silence
function checkForSilence() {
  const now = Date.now();

  lastMessageTimes.forEach((lastTime, guildId) => {
    // If 30 minutes of silence has passed
    if (now - lastTime >= 30 * 60 * 1000) {
      const guild = client.guilds.cache.get(guildId);
      if (guild) {
        const defaultChannel =
          guild.systemChannel ||
          guild.channels.cache.find(
            (channel) =>
              channel.isTextBased() &&
              channel.permissionsFor(guild.members.me).has("SendMessages")
          );
        if (defaultChannel) {
          console.log(`Sending "AWKWARD SILENCE" to guild: ${guild.name}`);
          defaultChannel.send("AWKWARD SILENCE 😬");
        } else {
          console.log(`No accessible channel found in guild: ${guild.name}`);
        }
      } else {
        console.log(`Guild with ID ${guildId} not found.`);
      }
      // Update the last message time to prevent repeated messages
      lastMessageTimes.set(guildId, now);
    }
  });
}

// Function to send "Good morning" and "Good night" messages
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

// Schedule Good Morning at 8:05 AM every day
function scheduleDailyMessages() {
  // Schedule "Good Morning" at 8:05 AM
  const morningJob = new cron.CronJob(
    "5 8 * * *",
    sendGoodMorningMessage,
    null,
    true,
    "America/New_York"
  );
  morningJob.start();

  // Schedule "Good Night" at 9:45 PM every day
  const nightJob = new cron.CronJob(
    "45 21 * * *",
    sendGoodNightMessage,
    null,
    true,
    "America/New_York"
  );
  nightJob.start();
}

// Set up an Express route to check if the bot is alive
app.get("/", (req, res) => {
  const now = new Date(); // Get the current date and time
  const formattedDate = now.toLocaleString(); // Format the date and time
  res.send(`Bot is running<br>Current date and time: ${formattedDate}`);
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
