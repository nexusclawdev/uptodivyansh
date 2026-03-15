import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = path.join(__dirname, 'AI-Money-Playbook-by-Uptodivyansh.pdf');
const indexPath = path.join(__dirname, 'index.html');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const UPIGATEWAY_KEY = process.env.UPIGATEWAY_KEY || 'fdde97dc-7bad-4f7e-b1a3-d93ee24a5d21';

app.get('/api/test-email', (req, res) => {
  res.json({ 
    gmailConfigured: !!(GMAIL_USER && GMAIL_PASS),
    gmailUser: GMAIL_USER ? GMAIL_USER.substring(0, 5) + '...' : 'NOT SET',
    gmailPassSet: !!GMAIL_PASS
  });
});

app.post('/api/create-order', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_mobile } = req.body;
    
    const payload = {
      key: UPIGATEWAY_KEY,
      client_txn_id: Date.now().toString(),
      amount: '97',
      p_info: 'Uptodivyansh AI Wealth Blueprint',
      customer_name,
      customer_email,
      customer_mobile: customer_mobile || '',
      redirect_url: `${req.protocol}://${req.get('host')}/success.html`
    };

    const response = await fetch('https://api.ekqr.in/api/create_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ status: false, msg: 'Failed to create order' });
  }
});

app.get('/api/webhook', (req, res) => {
  res.json({ status: 'active', message: 'Webhook endpoint is live.', version: '3.0.0' });
});

app.post('/api/webhook', async (req, res) => {
  try {
    const { status, customer_email, customer_name, client_txn_id } = req.body;
    console.log(`Webhook: Txn ${client_txn_id} | Status: ${status}`);

    if (status === 'success' && customer_email) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: GMAIL_USER, pass: GMAIL_PASS }
      });

      await transporter.sendMail({
        from: `"Uptodivyansh" <${GMAIL_USER}>`,
        to: customer_email,
        subject: 'Your AI Wealth Blueprint is Here!',
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2>Congratulations, ${customer_name || 'there'}!</h2>
            <p>Thank you for your purchase. Your AI Money Playbook is attached.</p>
            <p>Team Uptodivyansh</p>
          </div>
        `,
        attachments: [{
          filename: 'AI-Money-Playbook-by-Uptodivyansh.pdf',
          path: pdfPath
        }]
      });

      console.log(`Email sent to ${customer_email}`);
      return res.json({ status: 'delivered' });
    }

    res.json({ status: 'ignored' });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/verify', async (req, res) => {
  const { client_txn_id } = req.query;
  if (!client_txn_id) {
    return res.status(400).json({ status: false, message: 'Transaction ID required' });
  }

  try {
    const response = await fetch('https://api.ekqr.in/api/check_order_status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: UPIGATEWAY_KEY, client_txn_id })
    });

    const result = await response.json();
    if (result.status && result.data?.status === 'success') {
      return res.json({ status: true, message: 'Payment Verified', download_ready: true });
    }
    return res.json({ status: false, message: 'Payment not completed' });
  } catch (error) {
    console.error('Verify Error:', error);
    res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
