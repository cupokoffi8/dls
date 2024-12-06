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

  // Respond if the bot is mentioned and the message contains "hi"
  if (message.mentions.has(client.user) && /\bhi\b/.test(content)) {
    message.reply("Hello! 👋");
    return;
  }

  // Respond with a random message if the bot is mentioned
  if (message.mentions.has(client.user)) {
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
      "Ball delivery"
    ];

    const randomMessage =
      randomResponses[Math.floor(Math.random() * randomResponses.length)];
    console.log(`Responding with a random message: "${randomMessage}"`);
    message.reply(randomMessage);
    return;
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
  const now = new Date(); // Get the current date and time
  const formattedDate = now.toLocaleString(); // Format the date and time
  res.send(`Bot is running<br>Current date and time: ${formattedDate}`);
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
