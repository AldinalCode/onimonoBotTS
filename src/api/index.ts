import { Telegraf } from "telegraf";
import { VercelRequest, VercelResponse } from "@vercel/node";

import { registerCommands } from "./commands";
import { getUserRole } from "../middlewares/auth";

const bot = new Telegraf(process.env.BOT_TOKEN!);

// Middleware untuk mendapatkan role pengguna dari database
bot.use(getUserRole);

registerCommands(bot);

// Jalankan bot
if (process.env.NODE_ENV === "development") {
  bot.launch().then(() => {
    console.log("Bot is running...");
  });
}

export default async (req: VercelRequest, res: VercelResponse) => {
  console.log("Request received:", req.method, req.body);

  if (req.method !== "POST") {
    console.log("Invalid method:", req.method);
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    await bot.handleUpdate(req.body); // Handle update dari Telegram
    console.log("Update handled successfully");
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error handling update:", error);
    res.status(500).send("Internal Server Error");
  }
};
