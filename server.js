import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = path.join(__dirname, 'AI-Money-Playbook-by-Uptodivyansh.pdf');
const indexPath = path.join(__dirname, 'index.html');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const UPIGATEWAY_KEY = process.env.UPIGATEWAY_KEY;

app.get('/api/test-email', (req, res) => {
  res.json({ 
    gmailConfigured: !!(GMAIL_USER && GMAIL_PASS),
    gmailUser: GMAIL_USER ? GMAIL_USER.substring(0, 5) + '...' : 'NOT SET',
    gmailPassSet: !!GMAIL_PASS,
    upiGatewayKeySet: !!UPIGATEWAY_KEY,
    upiGatewayKeyPreview: UPIGATEWAY_KEY ? UPIGATEWAY_KEY.substring(0, 5) + '...' : 'NOT SET'
  });
});

app.get('/api/send-test-email', async (req, res) => {
  const testEmail = req.query.email;
  if (!testEmail) {
    return res.status(400).json({ error: 'Add ?email=your@email.com' });
  }
  
  if (!GMAIL_USER || !GMAIL_PASS) {
    return res.status(500).json({ error: 'Gmail not configured' });
  }
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS }
    });

    await transporter.sendMail({
      from: `"Uptodivyansh" <${GMAIL_USER}>`,
      to: testEmail,
      subject: 'Test - AI Wealth Blueprint',
      html: '<p>Email is working! Payment webhook will send the PDF after successful payment.</p>'
    });
    
    res.json({ success: true, message: 'Test email sent!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.post('/api/create-uropay-order', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_mobile } = req.body;
    
    // We expect UROPAY_API_KEY from env, or we hardcode it since they gave it
    const apiKey = process.env.UROPAY_API_KEY || "65A6MT4JCUDBQT6X";
    const secret = process.env.UROPAY_SECRET;
    
    if (!secret) {
      return res.status(500).json({ status: false, msg: 'UROPAY_SECRET is not configured on server' });
    }

    const sha512 = crypto.createHash('sha512').update(secret).digest('hex');
    const authHeader = `Bearer ${sha512}`;

    const orderPayload = {
      vpa: "encryptshahi@fam",
      vpaName: "Divyansh",
      amount: 9700,
      merchantOrderId: "ORDER" + Date.now().toString(),
      customerName: customer_name,
      customerEmail: customer_email,
      notes: { mobile: customer_mobile || '' }
    };

    const ur = await fetch('https://api.uropay.me/order/generate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-KEY': apiKey,
        'Authorization': authHeader
      },
      body: JSON.stringify(orderPayload)
    });

    const result = await ur.json();
    if (result.code === 200 && result.data) {
      res.json({
        status: true,
        data: result.data // contains upiString, qrCode, uroPayOrderId
      });
    } else {
      res.status(400).json({ status: false, msg: result.message || 'Payment generation failed' });
    }
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ status: false, msg: 'Internal server error' });
  }
});

app.get('/api/verify-uropay', async (req, res) => {
  try {
    const { orderId } = req.query;
    const apiKey = process.env.UROPAY_API_KEY || "65A6MT4JCUDBQT6X";

    const ur = await fetch(`https://api.uropay.me/order/status/${orderId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-KEY': apiKey
      }
    });

    const result = await ur.json();
    
    // SECURITY: Only provide the product link if UroPay explicitly confirms the payment is COMPLETED
    if (result.data && result.data.orderStatus === 'COMPLETED') {
      result.data.secretLink = 'https://drive.google.com/file/d/1SrdCuwrLbLwERg_iFMvacRXgsuZwVHA3/view?pli=1';
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

app.get('/api/webhook', (req, res) => {
  res.json({ status: 'active', message: 'Webhook endpoint is live.', version: '3.0.0' });
});

app.post('/api/webhook', async (req, res) => {
  try {
    const environment = req.headers['x-uropay-environment'];
    const signature = req.headers['x-uropay-signature'];
    
    // Verify Signature if SECRET is provided
    if (process.env.UROPAY_SECRET && signature) {
      const sortedData = Object.fromEntries(
        Object.entries(req.body).sort(([a], [b]) => a.localeCompare(b))
      );
      const payload = {...sortedData, environment: environment};
      
      const sha512 = crypto.createHash('sha512').update(process.env.UROPAY_SECRET).digest('hex');
      const expectedSignature = crypto.createHmac('sha256', sha512).update(JSON.stringify(payload)).digest('hex');
      
      if (expectedSignature !== signature) {
        console.error('Webhook signature mismatch');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { amount, referenceNumber, customerEmail, customer_email, email, customerName, customer_name, name, from, vpa } = req.body;
    
    const targetEmail = customerEmail || customer_email || email;
    const targetName = customerName || customer_name || name || from || 'there';

    console.log(`Webhook Received: Ref ${referenceNumber} | Amount ${amount} | From: ${targetName} | Email: ${targetEmail}`);

    if (targetEmail) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: GMAIL_USER, pass: GMAIL_PASS }
      });

      await transporter.sendMail({
        from: `"Uptodivyansh" <${GMAIL_USER}>`,
        to: targetEmail,
        subject: 'Your AI Wealth Blueprint is Here!',
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2>Congratulations, ${targetName}!</h2>
            <p>Thank you for your purchase. Your AI Money Playbook is attached.</p>
            <p>Team Uptodivyansh</p>
          </div>
        `,
        attachments: [{
          filename: 'AI-Money-Playbook-by-Uptodivyansh.pdf',
          path: pdfPath
        }]
      });

      console.log(`Email sent to ${targetEmail}`);
      return res.json({ status: 'delivered' });
    }

    res.json({ status: 'ignored - no email available to send product' });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Self-ping every 7 minutes to prevent Render free tier cold starts
  const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  setInterval(async () => {
    try {
      await fetch(`${SELF_URL}/api/ping`);
      console.log(`[keep-alive] ping sent to ${SELF_URL}/api/ping`);
    } catch (e) {
      console.warn('[keep-alive] ping failed:', e.message);
    }
  }, 7 * 60 * 1000); // every 7 minutes
});

app.get('/api/ping', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});
