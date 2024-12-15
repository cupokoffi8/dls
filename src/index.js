global.ReadableStream = global.ReadableStream || require('node:stream/web').ReadableStream;

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
  const maxRetries = 5; // Maximum number of retries
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await hf.textGeneration({
        model: "EleutherAI/gpt-neo-2.7B", // Hugging Face model
        inputs: prompt,
        parameters: {
          max_new_tokens: 100,
          temperature: 0.7,
        },
      });

      let generatedText = response.generated_text;

      // Remove the original prompt from the response
      if (generatedText.startsWith(prompt)) {
        generatedText = generatedText.replace(prompt, "").trim();
      }

      // Remove any bot mention (e.g., @BotName or <@BotID>)
      const botMentionRegex = new RegExp(`@${botUser.username}|<@!?${botUser.id}>`, "gi");
      generatedText = generatedText.replace(botMentionRegex, "").trim();

      // Remove any HTML tags (e.g., <br>, <b>, etc.)
      generatedText = generatedText.replace(/<[^>]*>/g, "").trim();

      // Check if "Luigi" or "User says:" are in the text
      if (/User says:|Luigi/.test(generatedText)) {
        // Clean "Luigi says:" and "User says:"
        generatedText = generatedText
          .replace(/Luigi says:/gi, "")
          .replace(/User says:/gi, "")
          .trim();

        return generatedText;
      }

      // If no "Luigi" or "User says:", extract text after the last colon
      const colonIndex = generatedText.lastIndexOf(":");
      if (colonIndex !== -1 && colonIndex < generatedText.length - 1) {
        const textAfterColon = generatedText.substring(colonIndex + 1).trim();
        if (textAfterColon) {
          return textAfterColon; // Return the cleaned text after the colon
        }
      }

      console.warn(`Retry ${attempt + 1}: Response did not meet criteria.`);
      attempt++;
    } catch (error) {
      console.error("Error generating text:", error);
      return "Sorry, I couldn't think of a response. Try again later!";
    }
  }

  // Fallback response if all retries fail
  return "Mamma mia! I couldn't come up with something. Try again later!";
}

client.on("messageCreate", async (message) => {
  // Ignore messages from the bot itself
  if (message.author.bot) return;

  // Normalize and log the message content
  const content = message.content.trim().toLowerCase();
  console.log(`Received message: "${content}" from ${message.author.tag}`);

  // If the bot is mentioned, use GPT-J to respond
  if (message.mentions.has(client.user)) {
    console.log("Generating response with GPT-J");

    // Define the prompt to simulate Luigi's voice
    const prompt = `You are Luigi from Super Mario Bros. Respond in Luigi's cheerful, Italian-accented voice. User says: "${message.content}"`;

    // Generate the response from the Hugging Face API
    const response = await generateText(prompt, client.user); // Pass bot's user object

    // Send only the cleaned response as a reply to the user
    message.reply(response);
    return;
  }

// Existing logic for specific phrases
  if (/\bcan i get a what what\b/.test(content) && message.id !== lastRespondedMessageId) {
    console.log("Responding to 'Can I get a what what'");
    message.channel.send("WHAT WHAT");
    lastRespondedMessageId = message.id;
    return;
  }

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
  const morningJob = new cron.CronJob(
    "5 8 * * *",
    sendGoodMorningMessage,
    null,
    true,
    "America/New_York"
  );
  morningJob.start();

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
  console.log(`Luigi running on port ${port}`);
});
