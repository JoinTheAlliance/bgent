import * as c from "ansi-colors";
class Logger {
  frameChar = "*";

  log(message: string, title: string = "", color: string = "white"): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    console.log(c[color]("*** LOG: " + title + "\n" + message));
  }

  warn(message: string, options = {}) {
    console.warn(message, { ...options });
  }

  error(message: string, options = {}) {
    console.error(message, { ...options });
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

const logger = new Logger();

export default logger;
