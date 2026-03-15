import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const config = {
  gmailUser: Deno.env.get("GMAIL_USER"),
  gmailPass: Deno.env.get("GMAIL_PASS"),
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({
      status: "active",
      message: "Webhook endpoint is live.",
      version: "1.0.0",
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { status, customer_email, customer_name, client_txn_id } = body;

    console.log(`Webhook: Txn ${client_txn_id} | Status: ${status}`);

    if (status === "success" && customer_email) {
      const client = new SMTPClient({
        hostname: "smtp.gmail.com",
        port: 465,
        username: config.gmailUser,
        password: config.gmailPass,
      });

      await client.send({
        from: `Uptodivyansh <${config.gmailUser}>`,
        to: customer_email,
        subject: "Your AI Wealth Blueprint is Here!",
        content: `Congratulations ${customer_name}! Your AI Money Playbook is attached.`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2>Congratulations, ${customer_name}!</h2>
            <p>Your AI Money Playbook is attached.</p>
            <p>Team Uptodivyansh</p>
          </div>
        `,
        attachments: [{
          filename: "AI-Money-Playbook-by-Uptodivyansh.pdf",
          path: "./AI-Money-Playbook-by-Uptodivyansh.pdf",
        }],
      });

      await client.close();
      console.log(`Sent to ${customer_email}`);

      return new Response(JSON.stringify({ status: "delivered" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: "ignored" }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
