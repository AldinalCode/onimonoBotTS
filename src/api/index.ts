import { Telegraf } from "telegraf";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { format, set } from "date-fns";
import { fi, id as localeId } from "date-fns/locale";
import ExcelJS from "exceljs";

import { supabase } from "../lib/supabase";
import { start } from "repl";

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

    type FilterCondition =
      | { type: "all" }
      | { type: "startDateOnly"; created_at: { gte: string; lte: string } }
      | { type: "startDateEndDate"; created_at: { gte: string; lte: string } }
      | { type: "fileCodeOnly"; file_code: string }
      | {
          type: "fileCodeDate";
          file_code: string;
          created_at: { gte: string; lte: string };
        }
      | {
          type: "fileCodeDateRange";
          file_code: string;
          created_at: { gte: string; lte: string };
        };

    let filterCondition: FilterCondition = { type: "all" };
    let startDate = null;
    let endDate = null;

    // if format is 'all' query all data
    if (args[1] === "all" && args.length === 2) {
      console.log("Query All");
      filterCondition = { type: "all" };
    } else if (args[1] === "date" && args.length >= 3 && args.length <= 4) {
      console.log("Query date");
      if (args.length === 3) {
        console.log("Query date only");
        // check if the date is valid
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(args[2])) {
          await ctx.reply("Format tanggal tidak valid. Gunakan YYYY-MM-DD.");
          return;
        }

        // startDate 00:00:00 and endDate 23:59:59 to locale id-ID
        startDate = format(
          set(new Date(args[2]), { hours: 0, minutes: 0, seconds: 0 }),
          "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
          { locale: localeId }
        );

        endDate = format(
          set(new Date(args[2]), { hours: 23, minutes: 59, seconds: 59 }),
          "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
          { locale: localeId }
        );
        console.log(startDate, endDate);

        filterCondition = {
          type: "startDateOnly",
          created_at: { gte: startDate, lte: endDate },
        };

        // filterCondition = { startDate: args[2] };
      } else if (args.length === 4) {
        console.log("Query date range");
        // check if the date is valid
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(args[2]) || !dateRegex.test(args[3])) {
          await ctx.reply("Format tanggal tidak valid. Gunakan YYYY-MM-DD.");
          return;
        }

        // startDate 00:00:00 and endDate 23:59:59 to locale id-ID
        startDate = format(
          set(new Date(args[2]), { hours: 0, minutes: 0, seconds: 0 }),
          "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
          { locale: localeId }
        );
        endDate = format(
          set(new Date(args[3]), { hours: 23, minutes: 59, seconds: 59 }),
          "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
          { locale: localeId }
        );
        console.log(startDate, endDate);
        filterCondition = {
          type: "startDateEndDate",
          created_at: { gte: startDate, lte: endDate },
        };
      }
    } else if (args[1] === "contains" && args.length === 3) {
      console.log("Query contains file code only");
      filterCondition = { type: "fileCodeOnly", file_code: args[2] };
    } else if (
      args[1] === "contains" &&
      args[3] === "date" &&
      args.length >= 5 &&
      args.length <= 6
    ) {
      console.log("Query contains file code and date");
      // check if the date is valid

      if (args.length === 5) {
        console.log("Query contains file code and date only");
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(args[4])) {
          await ctx.reply("Format tanggal tidak valid. Gunakan YYYY-MM-DD.");
          return;
        }
        // startDate 00:00:00 and endDate 23:59:59 to locale id-ID
        startDate = format(
          set(new Date(args[4]), { hours: 0, minutes: 0, seconds: 0 }),
          "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
          { locale: localeId }
        );
        endDate = format(
          set(new Date(args[4]), { hours: 23, minutes: 59, seconds: 59 }),
          "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
          { locale: localeId }
        );
        filterCondition = {
          type: "fileCodeDate",
          file_code: args[2],
          created_at: { gte: startDate, lte: endDate },
        };
      }

      if (args.length === 6) {
        console.log("Query contains file code and date range");

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(args[4]) || !dateRegex.test(args[5])) {
          await ctx.reply("Format tanggal tidak valid. Gunakan YYYY-MM-DD.");
          return;
        }

        // startDate 00:00:00 and endDate 23:59:59 to locale id-ID
        startDate = format(
          set(new Date(args[4]), { hours: 0, minutes: 0, seconds: 0 }),
          "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
          { locale: localeId }
        );
        endDate = format(
          set(new Date(args[5]), { hours: 23, minutes: 59, seconds: 59 }),
          "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
          { locale: localeId }
        );
        filterCondition = {
          type: "fileCodeDateRange",
          file_code: args[2],
          created_at: { gte: startDate, lte: endDate },
        };
      }
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

    // Fetch data from supabase
    const query = supabase.from("file_storage").select("*");

    if (filterCondition.type === "all") {
      query.order("created_at", { ascending: false });
    }

    if (
      filterCondition.type === "startDateOnly" ||
      filterCondition.type === "startDateEndDate"
    ) {
      query.gte("created_at", filterCondition.created_at.gte);
      query.lte("created_at", filterCondition.created_at.lte);
      query.order("created_at", { ascending: true });
    }

    if (filterCondition.type === "fileCodeOnly") {
      query.ilike("file_code", `%${filterCondition.file_code}%`);
      query.order("file_code", { ascending: true });
    }

    if (
      filterCondition.type === "fileCodeDate" ||
      filterCondition.type === "fileCodeDateRange"
    ) {
      query.ilike("file_code", `%${filterCondition.file_code}%`);
      query.gte("created_at", filterCondition.created_at.gte);
      query.lte("created_at", filterCondition.created_at.lte);
      query.order("file_code", { ascending: true });
    }

    const { data: files, error: fetchError } = await query;

    if (fetchError || !files) {
      console.error("Error fetching data:", fetchError);
      await ctx.reply("Terjadi kesalahan saat mengambil data dari database.");
      return;
    }

    console.log(files);

    // Export the database (this is just a placeholder, implement your own logic)

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("File Storage");

    worksheet.columns = [
      { header: "Created At", key: "created_at", width: 30 },
      { header: "File Code", key: "file_code", width: 60 },
      { header: "File ID", key: "file_id", width: 30 },
      { header: "File Name", key: "file_name", width: 50 }, // Kolom baru
      { header: "File Link", key: "file_link", width: 50 }, // Kolom baru
    ];

    // Isi data untuk kolom baru
    files.forEach((file) => {
      worksheet.addRow({
        created_at: format(new Date(file.created_at), "dd/MM/yyyy HH:mm:ss", {
          locale: localeId,
        }),
        file_code: file.file_code,
        file_id: file.file_id,
        // file_name: remove 7 char from behind and add .rar
        file_name:
          file.file_code.substring(0, file.file_code.length - 7) + ".rar",
        file_link: `https://onimonodotcom.blogspot.com/p/download.html?fileCode=${file.file_code}`,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: "center" };
    worksheet.getRow(1).height = 20;
    worksheet.getRow(1).font = { size: 14 };

    worksheet.autoFilter = {
      from: "A1",
      to: `E${files.length + 1}`, // Sesuaikan dengan jumlah kolom
    };

    if (
      filterCondition.type === "all" ||
      filterCondition.type === "startDateOnly" ||
      filterCondition.type === "startDateEndDate"
    ) {
      worksheet.getColumn("A").font = { bold: true };
      worksheet.getColumn("A").alignment = { horizontal: "center" };
    } else if (
      filterCondition.type === "fileCodeOnly" ||
      filterCondition.type === "fileCodeDate" ||
      filterCondition.type === "fileCodeDateRange"
    ) {
      worksheet.getColumn("B").font = { bold: true };
      worksheet.getColumn("B").alignment = { horizontal: "center" };
    }

    let fileNameExcel = "Data Onimono.xlsx";

    if (filterCondition.type === "all") {
      fileNameExcel = "Data Onimono - All.xlsx";
    } else if (filterCondition.type === "startDateOnly") {
      fileNameExcel = `Data Onimono - ${args[2]}.xlsx`;
    } else if (filterCondition.type === "startDateEndDate") {
      fileNameExcel = `Data Onimono - ${args[2]} to ${args[3]}.xlsx`;
    }
    if (filterCondition.type === "fileCodeOnly") {
      fileNameExcel = `Data Onimono - ${args[2]}.xlsx`;
    }
    if (filterCondition.type === "fileCodeDate") {
      fileNameExcel = `Data Onimono - ${args[2]} - ${args[4]}.xlsx`;
    }
    if (filterCondition.type === "fileCodeDateRange") {
      fileNameExcel = `Data Onimono - ${args[2]} - ${args[4]} to ${args[5]}.xlsx`;
    }
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      await ctx.replyWithDocument(
        { source: Buffer.from(buffer), filename: fileNameExcel },
        { caption: "Berikut adalah data yang diekspor dari database." }
      );
    } catch (error) {
      console.error("Error exporting Excel file:", error);
      await ctx.reply("Terjadi kesalahan saat mengekspor data ke Excel.");
    }

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

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    await bot.handleUpdate(req.body); // Handle update dari Telegram
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error handling update:", error);
    res.status(500).send("Internal Server Error");
  }
};

if (process.env.NODE_ENV === "production") {
  const webhookUrl = `https://${process.env.VERCEL_URL}/api`;

  bot.telegram
    .deleteWebhook()
    .then(() => {
      bot.telegram
        .setWebhook(webhookUrl)
        .then(() => {
          console.log(`Webhook set to ${webhookUrl}`);
        })
        .catch((error) => {
          console.error("Error setting webhook:", error);
        });
    })
    .catch((error) => {
      console.error("Error deleting webhook:", error);
    });
}

bot.on("text", (ctx) => {
  console.log("Received message:", ctx.message.text);
});
