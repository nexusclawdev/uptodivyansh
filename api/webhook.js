export const config = {
  api: {
    bodyParser: true,
  },
};

import nodemailer from 'nodemailer';

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
    const { status, customer_email, customer_name, client_txn_id } = req.body || {};

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
        from: `"Uptodivyansh" <${process.env.GMAIL_USER}>`,
        to: customer_email,
        subject: 'Your AI Wealth Blueprint is Here!',
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2>Congratulations, ${customer_name}!</h2>
            <p>Your AI Money Playbook is attached.</p>
            <p>Team Uptodivyansh</p>
          </div>
        `,
        attachments: [{
          filename: 'AI-Money-Playbook-by-Uptodivyansh.pdf',
          path: './AI-Money-Playbook-by-Uptodivyansh.pdf'
        }]
      });
      
      console.log(`Sent to ${customer_email}`);
      return res.status(200).json({ status: 'delivered' });
    }

    return res.status(200).json({ status: 'ignored' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
