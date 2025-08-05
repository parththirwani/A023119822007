type Stack = "backend";
type Level = "debug" | "info" | "warn" | "error" | "fatal";
type Package =
  | "cache" | "controller" | "cron_job" | "db"
  | "domain" | "handler" | "repository" | "route" | "service";

export function Log(
  stack: Stack,
  level: Level,
  pkg: Package,
  message: string
): void {
  const validStacks: Stack[] = ["backend"];
  const validLevels: Level[] = ["debug", "info", "warn", "error", "fatal"];
  const validPackages: Package[] = [
    "cache", "controller", "cron_job", "db",
    "domain", "handler", "repository", "route", "service"
  ];

  if (!validStacks.includes(stack)) {
    console.error("Invalid stack:", stack);
    return;
  }

  if (!validLevels.includes(level)) {
    console.error("Invalid level:", level);
    return;
  }

  if (!validPackages.includes(pkg)) {
    console.error("Invalid package:", pkg);
    return;
  }

  const data = {
    stack,
    level,
    package: pkg,
    message
  };

  fetch("http://20.244.56.144/evaluation-service/logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(res => {
      console.log("Log sent:", res);
    })
    .catch(err => {
      console.error("Failed to log:", err.message);
    });
}


