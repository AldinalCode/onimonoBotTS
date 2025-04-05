import { Context } from "telegraf";
import { supabase } from "../../lib/supabase";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const documentCommand = async (ctx: Context) => {
  try {
    // Get the user ID
    const userId = ctx.from?.id;

    // Search the user in supabase and role is Admin
    const { data: user, error } = await supabase
      .from("users")
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
    if (!ctx.message || !("document" in ctx.message)) {
      await ctx.reply("Dokumen tidak ditemukan dalam pesan.");
      return;
    }

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
};
