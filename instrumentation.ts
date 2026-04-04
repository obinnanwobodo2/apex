import { logApplicationError } from "@/lib/security-monitoring";

const STATE = globalThis as unknown as {
  __apexProcessErrorHooksInstalled?: boolean;
};

export async function register() {
  if (STATE.__apexProcessErrorHooksInstalled) return;
  STATE.__apexProcessErrorHooksInstalled = true;

  process.on("unhandledRejection", (reason) => {
    void logApplicationError({
      source: "node_process",
      severity: "critical",
      message: "Unhandled promise rejection",
      error: reason,
    });
  });

  process.on("uncaughtException", (error) => {
    void logApplicationError({
      source: "node_process",
      severity: "critical",
      message: "Uncaught exception",
      error,
    });
  });
}
