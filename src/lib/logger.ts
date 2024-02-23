class Logger {
  frameChar = "*";

  log(
    message: string,
    // {
    //   title = "",
    //   // color = "white",
    // }: {
    //   title?: string;
    //   // color?;
    // },
  ): void {
    console.log("*** LOG: " + "\n" + message);
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

export default new Logger();
