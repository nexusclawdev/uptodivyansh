import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pdfPath = __dirname + "/AI-Money-Playbook-by-Uptodivyansh.pdf";

const env = Deno.env.toObject();
const getEnv = (key) => env[key];

const HTML = await readFileSync("index.html", "utf-8");
const PDF_DATA = readFileSync(pdfPath);

async function handler(req) {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/" || path === "/index.html") {
    return new Response(HTML, {
      headers: { "Content-Type": "text/html" }
    });
  }

  if (path === "/api/webhook" && req.method === "GET") {
    return new Response(JSON.stringify({
      status: "active",
      message: "Webhook endpoint is live.",
      version: "2.2.0"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (path === "/api/webhook" && req.method === "POST") {
    try {
      const body = await req.json();
      const { status, customer_email, customer_name, client_txn_id } = body;
      
      console.log(`Webhook: Txn ${client_txn_id} | Status: ${status}`);

      if (status === "success" && customer_email) {
        console.log(`Would send email to ${customer_email} - Email feature disabled in Deno`);
        return new Response(JSON.stringify({ status: "delivered" }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ status: "ignored" }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Webhook Error:", error);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  if (path === "/api/verify" && req.method === "GET") {
    const client_txn_id = url.searchParams.get("client_txn_id");
    
    if (!client_txn_id) {
      return new Response(JSON.stringify({ status: false, message: "Transaction ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      const upiGatewayKey = getEnv("UPIGATEWAY_KEY");
      const response = await fetch("https://api.ekqr.in/api/check_order_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: upiGatewayKey, client_txn_id })
      });

      const result = await response.json();

      if (result.status && result.data && result.data.status === "success") {
        return new Response(JSON.stringify({ 
          status: true, 
          message: "Payment Verified",
          download_ready: true 
        }), { headers: { "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ 
        status: false, 
        message: "Payment not completed or failed." 
      }), { headers: { "Content-Type": "application/json" } });

    } catch (error) {
      console.error("Verify Error:", error);
      return new Response(JSON.stringify({ status: false, message: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return new Response("Not Found", { status: 404 });
}

Deno.serve(handler);
