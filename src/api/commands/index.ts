import { Telegraf } from "telegraf";
import { startCommand } from "./start";
import { helpCommand } from "./help";
import { downloadCommand } from "./download";
import { exportFileCommand } from "./exportfile";
import { documentCommand } from "./document";
import { encryptCommand } from "./encrypt";
import { decryptCommand } from "./decrypt";
import { shortlinkCommand, shortlinkReplaceCommand } from "./shortlink";

export const registerCommands = (bot: Telegraf) => {
  bot.start(startCommand);
  bot.command("help", helpCommand);
  bot.on("document", documentCommand);

  bot.command("download", downloadCommand);
  bot.command("exportfile", exportFileCommand);
  bot.command("encrypt", encryptCommand);
  bot.command("decrypt", decryptCommand);
  bot.command("shortlink", shortlinkCommand);
  if (process.env.NODE_ENV === "development") {
    bot.command("shortlinkreplace", shortlinkReplaceCommand);
  }
};
