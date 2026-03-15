import nodemailer from 'nodemailer';

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
        const { status, customer_email, customer_name, client_txn_id } = req.body;

        console.log(`Received Webhook for Txn: ${client_txn_id} | Status: ${status}`);

        // Only proceed if the payment was successful
        if (status === 'success' && customer_email) {
            
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
                to: customer_email,
                subject: 'Your AI Wealth Blueprint is Here! 🚀',
                html: `
                    <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                        <h2>Congratulations, ${customer_name}!</h2>
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
            console.log(`Success: Ebook sent to ${customer_email}`);
            
            return res.status(200).json({ status: 'delivered' });
        }

        return res.status(200).json({ status: 'ignored', message: 'Not a success status' });

    } catch (error) {
        console.error('Webhook Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
