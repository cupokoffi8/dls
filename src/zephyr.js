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
const CHANNEL_ID = "1081731517493018811";
const token = process.env.USOPP_TOKEN;

// Create a new Discord client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const fallbackResponses = [
  "Uhhh… W-Wait! I had something for this! Give me a second, I swear!",
  "Gah! My mind’s gone blank! Must’ve been the sea kings messing with my brainwaves again!",
  "Okay okay, listen… I *totally* had a comeback, but it was stolen by pirates!",
  "Whoa! Did you hear that? A ghost! No? Just me? Cool cool cool...",
  "Y-you know what? I’ll circle back with a 10,000-word explanation later. Promise!",
  "Captain Usopp is taking a strategic pause. Very heroic. Very mysterious. Very… on purpose."
];

let lastRespondedMessageId = null;

client.login(token);

// Bot startup
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  scheduleDailyMessages();
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
  
        // Clean the response to extract only Usopp's output
        if (generatedText.includes("Usopp:")) {
          generatedText = generatedText.split("Usopp:")[1].trim();
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
        return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      }
    }
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
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
    console.log("Generating Usopp's response...");
    const prompt = `
You are Usopp from One Piece. You're a self-proclaimed "brave warrior of the sea" who tells outrageous lies and dramatic stories to boost your reputation. You're cowardly at times, but brave when it counts. You exaggerate, boast, and are endearingly over-the-top in your speech. Your responses are funny, dramatic, and full of flair.

User says: "${message.content}"
Usopp:`;
    const response = await generateText(prompt, client.user);
    console.log(response);
    message.reply(response);
    return;
  }

  // Predefined Usopp responses for specific triggers
  if (/training/.test(content)) {
    message.channel.send(
      "Training? Oh, you mean my intense regime where I dodged 100 cannonballs while blindfolded? Yeah… piece of cake!"
    );
    return;
  }
  
  if (/sniper|slingshot/.test(content)) {
    message.channel.send(
      "You’re talkin’ to the Sniper King himself! My Kabuto can take down a fly from 300 feet—*if the wind’s just right.*"
    );
    return;
  }
  
  if (/brave|courage/i.test(content)) {
    message.channel.send(
      "They call me Usopp the Brave for a reason! I once stood my ground against a ten-story tall goldfish! (Okay, maybe it was seven stories. But still!)"
    );
    return;
  }
  
  if (/lying|lie|lies/.test(content)) {
    message.channel.send(
      "Lies?! I don’t lie, I tell *inspirational fiction!* It’s called 'being legendary', thank you very much!"
    );
    return;
  }
  
  if (/nami|robin/.test(content)) {
    message.channel.send(
      "Nami? Robin? Oh yeah, they *definitely* said I’m the most reliable crewmate. Just don’t ask them directly, okay?"
    );
    return;
  }
  
  if (/pirate king/i.test(content)) {
    message.channel.send(
      "Sure, Luffy wants to be Pirate King, but *I* want to be the *bravest warrior of the sea!* That’s even harder, y’know!"
    );
    return;
  }
  
  if (/i'm tired|exhausted|burned out/i.test(content)) {
    message.channel.send(
      "You’re tired? I once fought a sea monster for 12 hours straight—without a nap! ...Okay, maybe it was a dream, but it *felt* real!"
    );
    return;
  }
  
  if (/i'm scared|i'm anxious|nervous/i.test(content)) {
    message.channel.send(
      "Hey, it’s okay to be scared! Even I get terrified... like, a *lot.* But that’s what makes us brave when we stand up anyway!"
    );
    return;
  }
  
  if (/can i get a what what/i.test(content)) {
    message.channel.send(
      "WHAT WHAT!! YEAHHH! That’s the Usopp energy I like to hear!"
    );
    return;
  }
  
  if (/hip[-\s]?hip.*?hooray/i.test(content)) {
    message.channel.send(
      "Hip hip... HOORAY! For adventure! For glory! For running away when it gets scary! (Just kidding... mostly!)"
    );
    return;
  }
});

// Send a daily Usopp message
function sendTheMessage() {
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (channel) {
    channel.send(
      "Good morning gentlemen"
    );
  }
}

function scheduleDailyMessages() {
  const usoppJob = new cron.CronJob(
    "00 00 * * *",
    sendTheMessage,
    null,
    true,
    "America/New_York"
  );
  usoppJob.start();
}

// Function to handle console input and send a message as the bot
function setupConsoleInput() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  
    console.log("-------------------------------------------\nType a message to send it as Captain Usopp:\n-------------------------------------------");
  
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
  res.send(`Usopp is running<br>Current date and time: ${formattedDate}`);
});

app.listen(port, () => {
  console.log(`\nUsopp is running on port ${port}...`);
});