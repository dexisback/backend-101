type LogLevel = "INFO" | "STEP" | "OK" | "WARN" | "ERR";

const isDemoLogsEnabled = () => {
  // Defaults to on for demos; disable with DEMO_LOGS=false
  const raw = (process.env.DEMO_LOGS || "").toLowerCase().trim();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  return true;
};

const supportsColor = () => Boolean(process.stdout.isTTY);

const color = (code: number, text: string) =>
  supportsColor() ? `\u001b[${code}m${text}\u001b[0m` : text;

const dim = (text: string) => color(2, text);
const gray = (text: string) => color(90, text);
const cyan = (text: string) => color(36, text);
const green = (text: string) => color(32, text);
const yellow = (text: string) => color(33, text);
const red = (text: string) => color(31, text);
const magenta = (text: string) => color(35, text);

const fmtLevel = (level: LogLevel) => {
  switch (level) {
    case "INFO":
      return cyan("INFO");
    case "STEP":
      return magenta("STEP");
    case "OK":
      return green("OK");
    case "WARN":
      return yellow("WARN");
    case "ERR":
      return red("ERR");
  }
};

const now = () => {
  const iso = new Date().toISOString();
  // HH:MM:SS.mmm
  return iso.slice(11, 23);
};

const safeJson = (value: unknown) => {
  if (value === undefined) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const println = (line: string) => {
  // eslint-disable-next-line no-console
  console.log(line);
};

export const demoLog = {
  enabled: isDemoLogsEnabled,

  banner: (title: string) => {
    if (!isDemoLogsEnabled()) return;
    const line = supportsColor()
      ? gray("─".repeat(Math.min(60, Math.max(24, title.length + 10))))
      : "-".repeat(Math.min(60, Math.max(24, title.length + 10)));
    println(`${line}\n${dim(now())} ${cyan(title)}\n${line}`);
  },

  info: (pipeline: string, message: string, meta?: unknown) => {
    if (!isDemoLogsEnabled()) return;
    const metaText = meta === undefined ? "" : ` ${gray(safeJson(meta))}`;
    println(`${dim(now())} ${fmtLevel("INFO")} ${cyan(`[${pipeline}]`)} ${message}${metaText}`);
  },

  step: (pipeline: string, message: string, meta?: unknown) => {
    if (!isDemoLogsEnabled()) return;
    const metaText = meta === undefined ? "" : ` ${gray(safeJson(meta))}`;
    println(`${dim(now())} ${fmtLevel("STEP")} ${magenta(`[${pipeline}]`)} ${message}${metaText}`);
  },

  ok: (pipeline: string, message: string, meta?: unknown) => {
    if (!isDemoLogsEnabled()) return;
    const metaText = meta === undefined ? "" : ` ${gray(safeJson(meta))}`;
    println(`${dim(now())} ${fmtLevel("OK")} ${green(`[${pipeline}]`)} ${message}${metaText}`);
  },

  warn: (pipeline: string, message: string, meta?: unknown) => {
    if (!isDemoLogsEnabled()) return;
    const metaText = meta === undefined ? "" : ` ${gray(safeJson(meta))}`;
    println(`${dim(now())} ${fmtLevel("WARN")} ${yellow(`[${pipeline}]`)} ${message}${metaText}`);
  },

  err: (pipeline: string, message: string, meta?: unknown) => {
    if (!isDemoLogsEnabled()) return;
    const metaText = meta === undefined ? "" : ` ${gray(safeJson(meta))}`;
    println(`${dim(now())} ${fmtLevel("ERR")} ${red(`[${pipeline}]`)} ${message}${metaText}`);
  },
};
