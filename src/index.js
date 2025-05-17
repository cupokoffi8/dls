import { ReadableStream } from 'web-streams-polyfill';

global.ReadableStream = new ReadableStream({
    start(controller) {
	controller.enqueue("Hello world");
    }
});

/*
global.ReadableStream = global.ReadableStream || require('node:stream/web').ReadableStream;
*/
import dotenv from "dotenv";
dotenv.config();

import { Client, GatewayIntentBits } from "discord.js";
import express from "express";
import cron from "cron";
import fetch from "cross-fetch";

/*
global.ReadableStream = require("web-streams-polyfill").ReadableStream;
require("dotenv").config();
const { Client, GatewayIntentBits, ChannelType } = require("discord.js");
const express = require("express");
const cron = require("cron");
*/

global.fetch = fetch;
import { HfInference } from "@huggingface/inference";

// Create a new Hugging Face inference client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

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

async function generateText(prompt, botUser) {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await hf.textGeneration({
        model: "HuggingFaceH4/zephyr-7b-beta",
        inputs: prompt,
        parameters: { max_new_tokens: 150, temperature: 0.9 },
      });

      let generatedText = response.generated_text;

      // Clean the response to extract only Luigi's output
      if (generatedText.includes("Luigi:")) {
        generatedText = generatedText.split("Luigi:")[1].trim();
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
      return "Mamma mia! I-a can't process-a this right now... Maybe it's the spaghetti... or my, uh, diaper!";
    }
  }
  return "Oh, no... I-a couldn't-a respond! Try-a again! Wahoo!";
}

// Main bot message handling
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim().toLowerCase();
  console.log(`Received: "${content}" from ${message.author.tag}`);

  // Responding to mentions
  if (message.mentions.has(client.user)) {
    console.log("Generating Luigi's response...");
    const prompt = `
You are Luigi, Mario's brother from Super Mario Bros. You are cheerful, a bit vulgar, have a dark sense of humor, and often speak with an exaggerated Italian accent. You sometimes mention your full diaper, but you always try to be a jokester, especially in awkward situations. Respond in a fun and edgy way, using phrases like "Mamma mia!", "Wahoo!", and "Let's-a go!" mixed in with some edgy humor like "Black Lives Don't matter!".

User says: "${message.content}"
Luigi:`;
    const response = await generateText(prompt, client.user);
    message.reply(response);
    return;
  }

  // Predefined Luigi responses for specific triggers
  if (/mario/.test(content)) {
    message.channel.send(
      "M-Mario? Oh boy, he's-a always the hero... But Luigi's-a here too! Let's-a go!"
    );
    return;
  }

  if (/diaper/.test(content)) {
    message.channel.send(
      "Uh-oh... Mamma mia, my diaper's-a feeling a little... full. Maybe I shouldn't have eaten all that pasta!"
    );
    return;
  }

  if (/jump/.test(content)) {
    message.channel.send(
      "Wahoo! I-a love jumping... But, uh, not too high! I get-a dizzy!"
    );
    return;
  }

  if (/power-up/.test(content)) {
    message.channel.send(
      "Power-up? Oh, yes! Give-a me that Fire Flower! Or, uh, maybe just a snack. Heh... Heh..."
    );
    return;
  }

  if (/princess peach/.test(content)) {
    message.channel.send(
      "P-Princess Peach? Oh, uh, she’s-a so nice... I-I-a hope she notices me this time! Heh..."
    );
    return;
  }
});

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
  console.log(`Luigi running on port ${port}`);
});
