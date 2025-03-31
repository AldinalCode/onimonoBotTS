import { Telegraf } from "telegraf";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import ExcelJS from "exceljs";

import { supabase } from "../lib/supabase";

const bot = new Telegraf(process.env.BOT_TOKEN!);

// Command: /start
bot.start(async (ctx) => {
  await ctx.reply(
    `
🎮 *Selamat datang di OnimonoBot!* 🎮

Fitur yang tersedia:
- */download* - Download File
- */exportdb* - Ekspor Database (Hanya untuk Admin)
- */help* - Bantuan

- *File ID Generator* (Hanya untuk Admin)
    `,
    { parse_mode: "Markdown" }
  );
});

// Command: /download
bot.command("download", async (ctx) => {
  try {
    // Check if the format is correct
    const args = ctx.message.text.split(" ");
    if (args.length !== 2) {
      await ctx.reply("Format yang benar: /download <file_code>");
      return;
    }
    const fileCode = args[1];

    await ctx.reply("Sedang memproses permintaan...");

    // Search the file code in supabase
    const { data: file, error } = await supabase
      .from("file_storage")
      .select("*")
      .eq("file_code", fileCode)
      .single();

    // If file is found, send the file to user
    if (file) {
      await ctx.reply("Download Games hanya di https://onimono.com/");
      await ctx.replyWithDocument(file.file_id);
    } else {
      await ctx.reply("File tidak ditemukan.");
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    ctx.reply("Terjadi kesalahan saat memproses permintaan Anda.");
  }
});

// Command: /exportdb
bot.command("exportdb", async (ctx) => {
  try {
    // Get the user ID
    const userId = ctx.from?.id;

    // Search the user in supabase and role is Admin
    const { data: user, error } = await supabase
      .from("admins")
      .select("*")
      .eq("user_id", userId)
      .eq("role", "Admin")
      .single();

    // If user is not found, send a message and return
    if (!user) {
      await ctx.reply("Anda tidak memiliki izin untuk menggunakan fitur ini.");
      return;
    }

    // If user is found, export the database
    await ctx.reply("Ekspor database sedang diproses...");

    // Check if format is correct
    const args = ctx.message.text.split(" ");

    console.log(args);

    // if format is 'all' query all data
    if (args[1] === "all" && args.length === 2) {
      console.log(args);
      console.log("ini All");
    } else if (args[1] === "date" && args.length >= 3 && args.length <= 4) {
      console.log(args);
      console.log("ini date");
      // Check
    } else if (args[1] === "contains" && args.length === 3) {
      console.log(args);
      console.log("ini contains");
    } else {
      await ctx.reply(
        `
📋 *Format yang Benar untuk Ekspor Database:* 📋

1️⃣ */exportdb all*  
   _Ekspor semua data dari database._
   Contoh: \`/exportdb all\`

2️⃣ */exportdb date <date>*  
   _Ekspor data berdasarkan tanggal tertentu._  
   Contoh: \`/exportdb date 2025-03-30\`

3️⃣ */exportdb date <start_date> <end_date>*  
   _Ekspor data berdasarkan rentang tanggal._  
   Contoh: \`/exportdb date 2025-03-01 2025-03-30\`

4️⃣ */exportdb contains <file_code>*  
   _Ekspor data yang mengandung kode file tertentu._  
   Contoh: \`/exportdb contains GTA-V\`

5️⃣ */exportdb contains <file_code> <date>*  
   _Ekspor data yang mengandung kode file tertentu pada tanggal tertentu._  
   Contoh: \`/exportdb contains GTA-V 2025-03-30\`

6️⃣ */exportdb contains <file_code> <start_date> <end_date>*  
   _Ekspor data yang mengandung kode file tertentu dalam rentang tanggal._  
   Contoh: \`/exportdb contains GTA-V 2025-03-01 2025-03-30\`
`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Export the database (this is just a placeholder, implement your own logic)
    const exportData = "Database exported successfully!";

    await ctx.reply(exportData);
  } catch (error) {
    console.error("Error fetching user:", error);
    ctx.reply("Terjadi kesalahan saat memproses permintaan Anda.");
  }
});

// Handle document
bot.on("document", async (ctx) => {
  try {
    // Get the user ID
    const userId = ctx.from?.id;

    // Search the user in supabase and role is Admin
    const { data: user, error } = await supabase
      .from("admins")
      .select("*")
      .eq("user_id", userId)
      .eq("role", "Admin")
      .single();

    // If user is not found, send a message and return
    if (!user) {
      await ctx.reply("Anda tidak memiliki izin untuk menggunakan fitur ini.");
      return;
    }

    // If user is found
    await ctx.reply("File sedang diproses...");

    // Get the file ID and file name from the document
    const fileId = ctx.message.document.file_id;
    const fileName = ctx.message.document.file_name || "unknown";

    // Search the file ID in supabase
    const { data: file, error: fileError } = await supabase
      .from("file_storage")
      .select("*")
      .eq("file_id", fileId)
      .single();

    // Format the date to Indonesian locale
    const formattedDate = format(
      new Date(file.created_at),
      "EEEE, dd MMMM yyyy HH:mm:ss",
      { locale: localeId }
    );

    // If file is found, send the existing
    if (file) {
      await ctx.reply(
        `
📂 *File Sudah Ada di Database* 📂

🗓️ *Tanggal*: ${formattedDate}
🔑 *File Code*: \`${file.file_code}\`
🆔 *File ID*: \`${file.file_id}\`
  `,
        { parse_mode: "Markdown" }
      );
      return;
    } else {
      // If file is not found, insert the file ID into the database
      // Generate a file code
      const randomHex = Array.from({ length: 6 }, () =>
        Math.floor(Math.random() * 16)
          .toString(16)
          .toUpperCase()
      ).join("");

      const fileCode = `${fileName.split(".")[0]}-${randomHex}`;

      const { data: insertFile, error: insertError } = await supabase
        .from("file_storage")
        .insert([
          {
            file_id: fileId,
            file_code: fileCode,
            created_at: new Date().toISOString(),
          },
        ])
        .single();

      if (insertError) {
        console.error("Error inserting file:", insertError);
        await ctx.reply("Terjadi kesalahan saat menyimpan file ke database.");
        return;
      }

      await ctx.reply(
        `
✅ *File Berhasil Disimpan ke Database* ✅

🗓️ *Tanggal*: ${formattedDate}
🔑 *File Code*: \`${fileCode}\`
🆔 *File ID*: \`${fileId}\`
  `,
        { parse_mode: "Markdown" }
      );
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    ctx.reply("Terjadi kesalahan saat memproses permintaan Anda.");
  }
});

// Jalankan bot
bot.launch().then(() => {
  console.log("Bot is running...");
});
