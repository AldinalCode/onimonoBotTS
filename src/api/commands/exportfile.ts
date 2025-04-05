import { Context } from "telegraf";
import { format, formatDate, set } from "date-fns";
import { id as localeId } from "date-fns/locale";
import ExcelJS from "exceljs";

import { supabase } from "../../lib/supabase";
import { formatDateDay, formatDateEnd, formatDateStart } from "../../lib/date";

export const exportFileCommand = async (ctx: Context) => {
  try {
    const role = ctx.state.role; // Ambil role dari middleware

    // Check if the user is an Admin
    if (role !== "Admin") {
      await ctx.reply("Anda tidak memiliki izin untuk menggunakan fitur ini.");
      return;
    }

    // If user is found, export the database
    await ctx.reply("Ekspor database sedang diproses...");

    // Check if format is correct
    const args =
      ctx.message && "text" in ctx.message ? ctx.message.text.split(" ") : [];

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
        startDate = formatDateStart(args[2]);

        endDate = formatDateEnd(args[2]);
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
        startDate = formatDateStart(args[2]);
        endDate = formatDateEnd(args[3]);
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
        startDate = formatDateStart(args[4]);
        endDate = formatDateEnd(args[4]);
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
        startDate = formatDateStart(args[4]);
        endDate = formatDateEnd(args[5]);
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

1️⃣ */exportfile all*  
   _Ekspor semua data dari database._
   Contoh: \`/exportfile all\`

2️⃣ */exportfile date <date>*  
   _Ekspor data berdasarkan tanggal tertentu._  
   Contoh: \`/exportfile date 2025-03-30\`

3️⃣ */exportfile date <start_date> <end_date>*  
   _Ekspor data berdasarkan rentang tanggal._  
   Contoh: \`/exportfile date 2025-03-01 2025-03-30\`

4️⃣ */exportfile contains <file_code>*  
   _Ekspor data yang mengandung kode file tertentu._  
   Contoh: \`/exportfile contains GTA-V\`

5️⃣ */exportfile contains <file_code> <date>*  
   _Ekspor data yang mengandung kode file tertentu pada tanggal tertentu._  
   Contoh: \`/exportfile contains GTA-V 2025-03-30\`

6️⃣ */exportfile contains <file_code> <start_date> <end_date>*  
   _Ekspor data yang mengandung kode file tertentu dalam rentang tanggal._  
   Contoh: \`/exportfile contains GTA-V 2025-03-01 2025-03-30\`
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
        created_at: formatDateDay(file.created_at),
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
    let firstUpperCase = "";

    if (filterCondition.type === "all") {
      fileNameExcel = "Data Onimono - All.xlsx";
    } else if (filterCondition.type === "startDateOnly") {
      fileNameExcel = `Data Onimono - ${args[2]}.xlsx`;
    } else if (filterCondition.type === "startDateEndDate") {
      fileNameExcel = `Data Onimono - ${args[2]} to ${args[3]}.xlsx`;
    }
    if (filterCondition.type === "fileCodeOnly") {
      firstUpperCase = args[2].charAt(0).toUpperCase() + args[2].slice(1);
      fileNameExcel = `Data Onimono - ${firstUpperCase}.xlsx`;
    }
    if (filterCondition.type === "fileCodeDate") {
      firstUpperCase = args[2].charAt(0).toUpperCase() + args[2].slice(1);
      fileNameExcel = `Data Onimono - ${firstUpperCase} - ${args[4]}.xlsx`;
    }
    if (filterCondition.type === "fileCodeDateRange") {
      firstUpperCase = args[2].charAt(0).toUpperCase() + args[2].slice(1);
      fileNameExcel = `Data Onimono - ${firstUpperCase} - ${args[4]} to ${args[5]}.xlsx`;
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
};
