import { Context } from "telegraf";
import { supabase } from "../../lib/supabase";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { safelinku } from "../../lib/safelinku";

export const documentCommand = async (ctx: Context) => {
  try {
    const role = ctx.state.role; // Ambil role dari middleware

    // Check if the user is an Admin
    if (role !== "Admin") {
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
📂 *File Name*: \`${file.file_name}\`
🔑 *File Code*: \`${file.file_code}\`
🆔 *File ID*: \`${file.file_id}\`
🔗 *File Link*:
\`${file.url_file}\`
🔗 *Shorted URL*:
\`${file.shorted_url}\`

*Note*: File sudah ada di database, tidak perlu disimpan lagi.
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

      // replace space with %20
      const fileNameEncoded = encodeURIComponent(fileCode);
      const fileUrl = `https://onimonodotcom.blogspot.com/p/download.html?fileCode=${fileNameEncoded}`;

      const shortedUrl = await safelinku(fileUrl);

      const { data: insertFile, error: insertError } = await supabase
        .from("file_storage")
        .insert([
          {
            file_name: fileName,
            file_code: fileCode,
            file_id: fileId,
            url_file: fileUrl,
            shorted_url: shortedUrl ?? null,
          },
        ])
        .single();

      console.log("insertFile", insertFile);
      console.log("insertError", insertError);

      if (insertError) {
        console.error("Error inserting file:", insertError);
        await ctx.reply("Terjadi kesalahan saat menyimpan file ke database.");
        return;
      }

      await ctx.reply(
        `
✅ *File Berhasil Disimpan ke Database* ✅

🗓️ *Tanggal*: ${formattedDate}
📂 *File Name*: \`${fileName}\`
🔑 *File Code*: \`${fileCode}\`
🆔 *File ID*: \`${fileId}\`
🔗 *File Link*:
\`${fileUrl}\`
🔗 *Shorted URL*:
\`${shortedUrl}\`

*Note*: File baru saja disimpan ke database.
  `,
        { parse_mode: "Markdown" }
      );
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    ctx.reply("Terjadi kesalahan saat memproses permintaan Anda.");
  }
};
