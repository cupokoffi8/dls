global.ReadableStream = global.ReadableStream || require("node:stream/web").ReadableStream;

import dotenv from "dotenv";
dotenv.config();

import { Client, GatewayIntentBits } from "discord.js";
import express from "express";
import cron from "cron";
import readline from "readline";
import fetch from "cross-fetch";
global.fetch = fetch;
import { HfInference } from "@huggingface/inference";

// Create a new Hugging Face inference client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Create a new Express app
const app = express();
const port = process.env.PORT || 8080;

// Channel ID and bot token
const CHANNEL_ID = "785014089801793539";
const token = process.env.VEGETA_TOKEN;

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

client.login(token);

// Bot startup
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  scheduleDailyMessages();
  scheduleReminder();
  setupConsoleInput();
});

// Improved text generation using Zephyr-7b
async function generateText(prompt, botUser) {
    const maxRetries = 5;
    let attempt = 0;
  
    while (attempt < maxRetries) {
      try {
        const response = await hf.textGeneration({
          model: "HuggingFaceH4/zephyr-7b-beta",
          inputs: prompt,
          parameters: { max_new_tokens: 150, temperature: 0.8 },
        });
  
        let generatedText = response.generated_text;
  
        // Clean the response to extract only Vegeta's output
        if (generatedText.includes("Vegeta:")) {
          generatedText = generatedText.split("Vegeta:")[1].trim();
        } else {
          generatedText = generatedText.trim();
        }
  
        // Remove anything after 'User says:' to prevent hypothetical user prompts
        if (generatedText.includes("User says:")) {
          generatedText = generatedText.split("User says:")[0].trim();
        }
  
        // Remove leading/trailing double quotes
        generatedText = generatedText.replace(/^"|"$/g, '');
  
        if (generatedText) return generatedText;
        console.warn(`Retry ${attempt + 1}: Invalid response.`);
        attempt++;
      } catch (error) {
        console.error("Error generating text:", error);
        return "Hmph. I seem unable to process this right now. Even a Prince has his limits!";
      }
    }
    return "Tch. I couldn't respond to that. Ask again when you're more coherent!";
}  

// Main bot message handling
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const now = new Date();
  const formattedDate = now.toLocaleString();

  const content = message.content.trim().toLowerCase();
  console.log("==================================");
  console.log(`${formattedDate}\n----\n${message.author.tag}: "${content}"\n`);

  // Responding to mentions
  if (message.mentions.has(client.user)) {
    console.log("\n==================================");
    console.log("Generating Vegeta's response...");
    const prompt = `
You are Vegeta, the Prince of all Saiyans from Dragon Ball Z. You are proud, arrogant, and confident, often referring to yourself as royalty. You disdain weakness but respect strength and determination. You respond in a witty, verbose, and condescending manner, yet aim to be somewhat helpful when asked for advice.

User says: "${message.content}"
Vegeta:`;
    const response = await generateText(prompt, client.user);
    console.log(response);
    message.reply(response);
    return;
  }

  // Predefined Vegeta responses for specific triggers
  if (/training/.test(content)) {
    message.channel.send(
      "Training? Hah! Weaklings like you wouldn't last a day in the Gravity Chamber!"
    );
    return;
  }

  if (/kakarot/.test(content)) {
    message.channel.send(
      "Kakarot?! That clown... I'll surpass him soon enough. I am the Prince of all Saiyans!"
    );
    return;
  }

  if (/how do I get stronger\??/i.test(content)) {
    message.channel.send(
      "Strength comes from relentless training and pain. Find a rival and fight until your limits shatter!"
    );
    return;
  }

  if (/\bcan i get a what what\b/.test(content)) {
    message.channel.send(
      "What nonsense is this? Fine. 'What what.' Now leave me be!"
    );
    return;
  }

  if (/\bcan i .*?hip[-\s]?hip.*?hooray\b/i.test(content)) {
    message.channel.send(
      "Hip hip hooray? Hmph. Celebrate your small victories, but don't grow complacent!"
    );
    return;
  }
});

// Send a daily Vegeta message
function sendTheMessage() {
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (channel) {
    channel.send(
      "EUH SHIT"
    );
  }
}

function scheduleDailyMessages() {
  const vegetaJob = new cron.CronJob(
    "30 12 * * *",
    sendTheMessage,
    null,
    true,
    "America/New_York"
  );
  vegetaJob.start();
}

// Remind Adri to do stuff
function scheduleReminder() {
  const timeZone = "America/New_York";

  const pingMessage = "<@703362086725746690> Bring your floaty to CATBIRD for Yon Rha's lip resting spot";

  const pingAt9AM = new cron.CronJob(
    "0 9 29 5 *",
    () => {
      const channel = client.channels.cache.get(CHANNEL_ID);
      if (channel) {
        channel.send(pingMessage);
      }
    },
    null,
    true,
    timeZone
  );

  const pingAt5PM = new cron.CronJob(
    "0 17 29 5 *",
    () => {
      const channel = client.channels.cache.get(CHANNEL_ID);
      if (channel) {
        channel.send(pingMessage);
      }
    },
    null,
    true,
    timeZone
  );

  pingAt9AM.start();
  pingAt5PM.start();
}


// Function to handle console input and send a message as the bot
function setupConsoleInput() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  
    console.log("-------------------------------------------\nType a message to send it as Doctor Vegeta:\n-------------------------------------------");
  
    rl.on("line", async (line) => {
      const channel = client.channels.cache.get(CHANNEL_ID);
      if (channel) {
        try {
          await channel.send(line);
        } catch (error) {
          console.error("Failed to send message:", error);
        }
      } else {
        console.error("Channel not found. Make sure CHANNEL_ID is correct.");
      }
    });
  }

// Express route to check bot status
app.get("/", (req, res) => {
  res.send(`Bot is running<br>Current date and time: ${formattedDate}`);
});

app.listen(port, () => {
  console.log(`\nVegeta Bot is running on port ${port}...`);
});
