export const config = {
  api: {
    bodyParser: true,
  },
};

import nodemailer from 'nodemailer';
import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Allow', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'active', 
      message: 'Webhook endpoint is live.',
      version: '2.0.4' 
    });
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ 
      status: 'active', 
      message: 'Method not allowed - use POST',
    });
  }

  try {
    const environment = req.headers['x-uropay-environment'];
    const signature = req.headers['x-uropay-signature'];
    
    // Verify Signature if SECRET is provided
    if (process.env.UROPAY_SECRET && signature) {
      const sortedData = Object.fromEntries(
        Object.entries(req.body || {}).sort(([a], [b]) => a.localeCompare(b))
      );
      const payload = {...sortedData, environment: environment};
      
      const sha512 = crypto.createHash('sha512').update(process.env.UROPAY_SECRET).digest('hex');
      const expectedSignature = crypto.createHmac('sha256', sha512).update(JSON.stringify(payload)).digest('hex');
      
      if (expectedSignature !== signature) {
        console.error('Webhook signature mismatch');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { amount, referenceNumber, customerEmail, customer_email, email, customerName, customer_name, name, from, vpa } = req.body || {};
    
    const targetEmail = customerEmail || customer_email || email;
    const targetName = customerName || customer_name || name || from || 'there';

    console.log(`Webhook Received: Ref ${referenceNumber} | Amount ${amount} | From: ${targetName} | Email: ${targetEmail}`);

    if (targetEmail) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: `"Uptodivyansh" <${process.env.GMAIL_USER}>`,
        to: targetEmail,
        subject: 'Your AI Wealth Blueprint is Here!',
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2>Congratulations, ${targetName}!</h2>
            <p>Your AI Money Playbook is attached.</p>
            <p>Team Uptodivyansh</p>
          </div>
        `,
        attachments: [{
          filename: 'AI-Money-Playbook-by-Uptodivyansh.pdf',
          path: './AI-Money-Playbook-by-Uptodivyansh.pdf'
        }]
      });
      
      console.log(`Sent to ${targetEmail}`);
      return res.status(200).json({ status: 'delivered' });
    }

    return res.status(200).json({ status: 'ignored - no email available to send product' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
