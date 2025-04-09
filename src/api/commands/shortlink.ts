import { Context } from "telegraf";
import { supabase } from "../../lib/supabase";
import { adfocus } from "../../lib/adfocus";

export const shortlinkCommand = async (ctx: Context) => {
  const role = ctx.state.role || "Guest"; // Ambil role dari middleware

  // Check if the user is an Admin
  if (role !== "Admin") {
    await ctx.reply("Anda tidak memiliki izin untuk menggunakan fitur ini.");
    return;
  }

  // check if the format is correct
  const args =
    ctx.message && "text" in ctx.message ? ctx.message.text.split(" ") : [];
  if (args.length > 1) {
    await ctx.reply(
      `Format yang benar: cukup ketikkan */shortlink* tanpa argumen tambahan.`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // activate shortlink where shorted_url is null or empty
  const { data: shorted_url, error: shorted_url_error } = await supabase
    .from("file_storage")
    .select("*")
    .is("shorted_url", null);

  // for each shorted_url
  if (shorted_url && shorted_url.length > 0) {
    await ctx.reply(`*Sedang memproses ${shorted_url.length} shortlink...*`, {
      parse_mode: "Markdown",
    });

    let shortlinkCount = 0;
    let shortlinkErrorCount = 0;

    // for each shorted_url
    for (const shorted of shorted_url) {
      const shortLink = await adfocus(shorted.url_file);

      if (shortLink) {
        // update shorted_url to shortLink
        const { error: updateError } = await supabase
          .from("file_storage")
          .update({ shorted_url: shortLink })
          .eq("file_code", shorted.file_code);

        if (updateError) {
          console.error("Error updating shorted_url:", updateError);
          shortlinkErrorCount++;
        } else {
          shortlinkCount++;
        }
      } else {
        shortlinkErrorCount++;
      }
    }

    await ctx.reply(
      `*Berhasil memproses ${shortlinkCount} shortlink dan ${shortlinkErrorCount} error*`,
      {
        parse_mode: "Markdown",
      }
    );
  } else {
    await ctx.reply(`*Tidak ada shortlink yang perlu diproses*`, {
      parse_mode: "Markdown",
    });
  }
};

export const shortlinkReplaceCommand = async (ctx: Context) => {
  const role = ctx.state.role || "Guest"; // Ambil role dari middleware

  // Check if the user is an Admin
  if (role !== "Admin") {
    await ctx.reply("Anda tidak memiliki izin untuk menggunakan fitur ini.");
    return;
  }

  // check if the format is correct
  const args =
    ctx.message && "text" in ctx.message ? ctx.message.text.split(" ") : [];
  if (args.length > 2) {
    await ctx.reply(
      `Format yang benar: cukup ketikkan */shortlink* <shortlink> <file_code>`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  const { data: shorted_url, error: shorted_url_error } = await supabase
    .from("file_storage")
    .select("*");

  // for each shorted_url
  if (shorted_url && shorted_url.length > 0) {
    await ctx.reply(`*Sedang memproses ${shorted_url.length} shortlink...*`, {
      parse_mode: "Markdown",
    });

    let shortlinkCount = 0;
    let shortlinkErrorCount = 0;

    // for each shorted_url
    for (const shorted of shorted_url) {
      const shortLink = await adfocus(shorted.url_file);

      if (shortLink) {
        console.log("Shortlink :", shortLink);
        // update shorted_url to shortLink
        const { error: updateError } = await supabase
          .from("file_storage")
          .update({ shorted_url: shortLink })
          .eq("file_code", shorted.file_code);

        if (updateError) {
          console.error("Error updating shorted_url:", updateError);
          shortlinkErrorCount++;
        } else {
          shortlinkCount++;
        }
      } else {
        shortlinkErrorCount++;
      }
    }

    await ctx.reply(
      `*Berhasil memproses dan mereplace ${shortlinkCount} shortlink dan ${shortlinkErrorCount} error*`,
      {
        parse_mode: "Markdown",
      }
    );
  } else {
    await ctx.reply(`*Tidak ada shortlink yang perlu diproses*`, {
      parse_mode: "Markdown",
    });
  }
};
