import { Context } from "telegraf";

export const helpCommand = async (ctx: Context) => {
  const role = ctx.state.role; // Ambil role dari middleware

  if (role === "Admin") {
    await ctx.replyWithMarkdownV2(
      `
🎮 *Selamat datang, Admin!* 🎮

*Fitur yang tersedia:*
- */download* - Download File
- */exportfile* - Ekspor Database
- */encrypt* - Enkripsi Judul Halaman
- */decrypt* - Dekripsi Judul Halaman
- */help* - Bantuan
`,
      { parse_mode: "MarkdownV2" }
    );
  } else {
    await ctx.replyWithMarkdownV2(
      `
🎮 *Selamat datang di OnimonoBot!* 🎮

*Fitur yang tersedia:*
- */download* - Download File
- */help* - Bantuan
`,
      { parse_mode: "MarkdownV2" }
    );
  }
};
