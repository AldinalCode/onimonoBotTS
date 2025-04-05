import { Context } from "telegraf";
import { supabase } from "../../lib/supabase";

export const decryptCommand = async (ctx: Context) => {
  try {
    const role = ctx.state.role; // Ambil role dari middleware

    // Check if the user is an Admin
    if (role !== "Admin") {
      await ctx.reply("Anda tidak memiliki izin untuk menggunakan fitur ini.");
      return;
    }

    // Check if the format is correct
    const args =
      ctx.message && "text" in ctx.message ? ctx.message.text.split(" ") : [];
    if (args.length < 2) {
      await ctx.reply("Format yang benar: /decrypt <encrypted_title>");
      return;
    }

    // Get the encrypted title
    const encryptedTitle = args.slice(1).join(" ");

    // Search the encrypted title in the database
    const { data: record, error: fetchError } = await supabase
      .from("title_encrypt")
      .select("title")
      .eq("encrypted_title", encryptedTitle)
      .single();

    if (fetchError || !record) {
      console.error("Error fetching decrypted title:", fetchError);
      await ctx.reply("Teks terenkripsi tidak ditemukan di database.");
      return;
    }

    // Send the original title to the user
    await ctx.reply(
      `Judul asli dari

\`${encryptedTitle}\`

adalah:

\`${record.title}\``,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error processing /decrypt command:", error);
    ctx.reply("Terjadi kesalahan saat memproses permintaan Anda.");
  }
};
