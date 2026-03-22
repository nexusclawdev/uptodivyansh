import nodemailer from 'nodemailer';
import crypto from 'crypto';

export default async function handler(req, res) {
    // Handle all HTTP methods
    if (req.method === 'GET') {
        return res.status(200).json({ 
            status: 'active', 
            message: 'Webhook endpoint is live.',
            version: '2.0.2' 
        });
    }

    if (req.method !== 'POST') {
        return res.status(200).json({ 
            status: 'active', 
            message: 'Endpoint accepts POST only.',
            method: req.method,
            version: '2.0.2' 
        });
    }

    try {
        const environment = req.headers['x-uropay-environment'];
        const signature = req.headers['x-uropay-signature'];
        
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
            
            // 1. Configure Email Transporter (Gmail)
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_PASS
                }
            });

            // 2. Define the Email Content
            const mailOptions = {
                from: `"Uptodivyansh" <${process.env.GMAIL_USER}>`,
                to: targetEmail,
                subject: 'Your AI Wealth Blueprint is Here! 🚀',
                html: `
                    <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                        <h2>Congratulations, ${targetName}!</h2>
                        <p>Thank you for your purchase. You are now one technical document away from permanently altering your revenue trajectory.</p>
                        <p><strong>Find your 10-page AI Money Playbook attached to this email.</strong></p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 0.8rem; color: #666;">If you have any issues, reply to this email.</p>
                        <p>Stay technical,<br><strong>Team Uptodivyansh</strong></p>
                    </div>
                `,
                attachments: [
                    {
                        filename: 'AI-Money-Playbook-by-Uptodivyansh.pdf',
                        path: './AI-Money-Playbook-by-Uptodivyansh.pdf' // Make sure this file exists in your project root!
                    }
                ]
            };

            // 3. Send the Email
            await transporter.sendMail(mailOptions);
            console.log(`Success: Ebook sent to ${targetEmail}`);
            
            return res.status(200).json({ status: 'delivered' });
        }

        return res.status(200).json({ status: 'ignored - no email available to send product' });

    } catch (error) {
        console.error('Webhook Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
