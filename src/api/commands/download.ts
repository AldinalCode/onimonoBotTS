import { Context } from "telegraf";
import { supabase } from "../../lib/supabase";

export const downloadCommand = async (ctx: Context) => {
  try {
    // Check if the format is correct
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("Terjadi kesalahan: pesan tidak valid.");
      return;
    }
    const args = (ctx.message as { text: string }).text.split(" ");

    // filecode is everything after the command
    if (args.length < 2) {
      await ctx.reply("Penggunaan yang benar: /download <file_code>");
      return;
    }

    const fileCode = args.slice(1).join(" ");

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
};
