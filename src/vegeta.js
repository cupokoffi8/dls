global.ReadableStream = global.ReadableStream || require("node:stream/web").ReadableStream;

import dotenv from "dotenv";
dotenv.config();

import { Client, GatewayIntentBits } from "discord.js";
import express from "express";
import cron from "cron";
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

  const content = message.content.trim().toLowerCase();
  console.log(`Received: "${content}" from ${message.author.tag}`);

  // Responding to mentions
  if (message.mentions.has(client.user)) {
    console.log("Generating Vegeta's response...");
    const prompt = `
You are Vegeta, the Prince of all Saiyans from Dragon Ball Z. You are proud, arrogant, and confident, often referring to yourself as royalty. You disdain weakness but respect strength and determination. You respond in a witty, verbose, and condescending manner, yet aim to be somewhat helpful when asked for advice.

User says: "${message.content}"
Vegeta:`;
    const response = await generateText(prompt, client.user);
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
      "The Prince of all Saiyans has arrived. What weakling dares summon me today?"
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

// Express route to check bot status
app.get("/", (req, res) => {
  const now = new Date();
  const formattedDate = now.toLocaleString();
  res.send(`Bot is running<br>Current date and time: ${formattedDate}`);
});

app.listen(port, () => {
  console.log(`Vegeta Bot is running on port ${port}`);
});