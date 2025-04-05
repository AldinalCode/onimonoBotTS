import { Context } from "telegraf";
import { supabase } from "../../lib/supabase";

export const encryptCommand = async (ctx: Context) => {
  try {
    const role = ctx.state.role; // Ambil role dari middleware

    // Check if the user is an Admin
    if (role !== "Admin") {
      await ctx.reply("Anda tidak memiliki izin untuk menggunakan fitur ini.");
      return;
    }

    // check if the format is correct
    const args =
      ctx.message && "text" in ctx.message ? ctx.message.text.split(" ") : [];
    if (args.length < 2) {
      await ctx.reply("Format yang benar: /encrypt Judul Downlad Link");
      return;
    }

    const title = args.slice(1).join(" ");

    // Search for the title in the database
    const { data: existingTitle, error: titleError } = await supabase
      .from("title_encrypt")
      .select("*")
      .eq("title", title)
      .single();

    if (existingTitle) {
      // If the title already exists, return the existing encrypted title
      await ctx.reply(
        `Judul dengan nama

\`${title}\`

ternyata *SUDAH ADA DI DATABASE* dengan hasil enkripsi: 

\`${existingTitle.encrypted_title}\``,
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Generate a unique encrypted title
    let encryptedTitle = "";
    let isUnique = false;

    while (!isUnique) {
      // Generate encrypted title
      encryptedTitle = Array.from({ length: 4 }, () =>
        Array.from({ length: 4 }, () =>
          Math.floor(Math.random() * 16)
            .toString(16)
            .toUpperCase()
        ).join("")
      ).join("-");

      // Check if the encrypted title is unique
      const { data: existingEncrypted, error: encryptedError } = await supabase
        .from("title_encrypt")
        .select("*")
        .eq("encrypted_title", encryptedTitle)
        .single();

      if (!existingEncrypted) {
        isUnique = true; // The encrypted title is unique
      }

      console.log("Encrypted Title:", encryptedTitle);
    }

    // Save the title and encrypted title to the database
    const { data: insertData, error: insertError } = await supabase
      .from("title_encrypt")
      .insert([
        {
          title: title,
          encrypted_title: encryptedTitle,
        },
      ]);

    if (insertError) {
      console.error("Error saving encrypted title:", insertError);
      await ctx.reply("Terjadi kesalahan saat menyimpan data ke database.");
      return;
    }

    // Send the encrypted title to the user
    await ctx.reply(
      `Judul dengan nama

\`${title}\`

telah *dienkripsi* menjadi:

\`${encryptedTitle}\``,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    ctx.reply("Terjadi kesalahan saat memproses permintaan Anda.");
  }
};
