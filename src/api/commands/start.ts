import { Context } from "telegraf";

export const startCommand = async (ctx: Context) => {
  const role = ctx.state.role; // Ambil role dari middleware

  if (role === "Admin") {
    await ctx.reply(
      `
🎮 *Selamat datang, Admin!* 🎮

*Fitur yang tersedia:*
- */download* - Download File
- */exportfile* - Ekspor Database
- */encrypt* - Enkripsi Judul Halaman
- */decrypt* - Dekripsi Judul Halaman
- */help* - Bantuan
      `,
      { parse_mode: "Markdown" }
    );
  } else {
    await ctx.reply(
      `
🎮 *Selamat datang di OnimonoBot!* 🎮

*Fitur yang tersedia:*
- */download* - Download File
- */help* - Bantuan
      `,
      { parse_mode: "Markdown" }
    );
  }
};
