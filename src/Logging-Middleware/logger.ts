type Stack = "backend";
type Level = "debug" | "info" | "warn" | "error" | "fatal";
type Package =
  | "cache" | "controller" | "cron_job" | "db"
  | "domain" | "handler" | "repository" | "route" | "service";

// Replace this with your real access token
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwYXJ0aHRoaXJ3YW5pd0BnbWFpbC5jb20iLCJleHAiOjE3NTQzODEwMDMsImlhdCI6MTc1NDM4MDEwMywiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjNmNjJkNTBiLTBlNTMtNGI1NC1iZmEyLTg2Yjg5YTcyZjdiNiIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InBhcnRoIHRoaXJ3YW5pIiwic3ViIjoiZGZlMTcyMTEtMzk0Ny00ZTI3LWEzM2ItMTc3MzZjMDlmNWEyIn0sImVtYWlsIjoicGFydGh0aGlyd2FuaXdAZ21haWwuY29tIiwibmFtZSI6InBhcnRoIHRoaXJ3YW5pIiwicm9sbE5vIjoiYTAyMzExOTgyMjAwNyIsImFjY2Vzc0NvZGUiOiJGelJHalkiLCJjbGllbnRJRCI6ImRmZTE3MjExLTM5NDctNGUyNy1hMzNiLTE3NzM2YzA5ZjVhMiIsImNsaWVudFNlY3JldCI6IkJmRFdBblV6VW5BYXdTUnAifQ.YTIN7lB7UNyo0DYt5Slu0bwwiX5L0m1EJ2yjvZ-t2Ws";

/**
 * Sends a log to the remote logging service.
 * Automatically stringifies the message and includes auth token.
 */
export function Log(
  stack: Stack,
  level: Level,
  pkg: Package,
  message: string | object
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

  const safeMessage = typeof message === "string"
    ? message
    : JSON.stringify(message);

  const data = {
    stack,
    level,
    package: pkg,
    message: safeMessage
  };

  fetch("http://20.244.56.144/evaluation-service/logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${AUTH_TOKEN}`
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
