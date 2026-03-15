import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pdfPath = join(dirname(fileURLToPath(import.meta.url)), 'AI-Money-Playbook-by-Uptodivyansh.pdf');

app.get('/api/webhook', (req, res) => {
  res.json({ status: 'active', message: 'Webhook endpoint is live.', version: '2.1.0' });
});

app.post('/api/webhook', async (req, res) => {
  try {
    const { status, customer_email, customer_name, client_txn_id } = req.body;
    
    console.log(`Webhook: Txn ${client_txn_id} | Status: ${status}`);

    if (status === 'success' && customer_email) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: `Uptodivyansh <${process.env.GMAIL_USER}>`,
        to: customer_email,
        subject: 'Your AI Wealth Blueprint is Here!',
        html: `
          <div style="font-family: sans-serif;">
            <h2>Congratulations, ${customer_name}!</h2>
            <p>Your AI Money Playbook is attached.</p>
            <p>Team Uptodivyansh</p>
          </div>
        `,
        attachments: [{
          filename: 'AI-Money-Playbook-by-Uptodivyansh.pdf',
          path: pdfPath
        }]
      });

      console.log(`Sent to ${customer_email}`);
      return res.json({ status: 'delivered' });
    }

    res.json({ status: 'ignored' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
