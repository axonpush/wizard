import http from "http";
import { exec } from "child_process";

const TIMEOUT_MS = 120_000;

interface AuthResult {
  apiKey: string;
  tenantId: string;
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd);
}

export function browserAuth(appUrl: string): Promise<AuthResult> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url!, `http://${req.headers.host}`);

      if (url.pathname === "/callback") {
        const apiKey = url.searchParams.get("api_key");
        const tenantId = url.searchParams.get("tenant_id");

        if (apiKey && tenantId) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end("<html><body><h2>Authenticated! You can close this tab.</h2></body></html>");
          server.close();
          resolve({ apiKey, tenantId });
        } else {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end("<html><body><h2>Missing credentials. Please try again.</h2></body></html>");
        }
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html><body><h2>Waiting for authentication...</h2></body></html>");
    });

    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as { port: number }).port;
      const authUrl = `${appUrl}/wizard-auth?port=${port}`;
      openBrowser(authUrl);
    });

    setTimeout(() => {
      server.close();
      reject(new Error("Browser authentication timed out after 2 minutes"));
    }, TIMEOUT_MS);
  });
}
