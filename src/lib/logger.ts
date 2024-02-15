import chalk, { ForegroundColorName } from "chalk";

class Logger {
  frameChar = "*";

  log(
    message: string,
    {
      title = "",
      frame = false,
      color = "white",
    }: {
      title?: string;
      frame?: boolean;
      color?: ForegroundColorName;
    },
  ): void {
    const coloredMessage = chalk[color](message);
    if (frame) {
      const framedMessage = this.frameMessage(coloredMessage, title);
      console.log(framedMessage);
    } else {
      console.log(coloredMessage);
    }
  }

  warn(message: string, options = {}) {
    this.log(message, { ...options, color: "yellow" });
  }

  error(message: string, options = {}) {
    this.log(message, { ...options, color: "red" });
  }

  frameMessage(message: string, title: string) {
    const lines = message.split("\n");
    const frameHorizontalLength = 30;
    const topFrame =
      this.frameChar.repeat(frameHorizontalLength + 4) +
      " " +
      this.frameChar +
      " " +
      (title ?? "log") +
      " ".repeat(
        frameHorizontalLength -
          ((title as string) ?? ("log" as string)).length +
          1,
      ) +
      this.frameChar.repeat(frameHorizontalLength + 4);
    const bottomFrame = this.frameChar.repeat(frameHorizontalLength + 4);
    return [topFrame, ...lines, bottomFrame].join("\n");
  }
}

export default new Logger();
