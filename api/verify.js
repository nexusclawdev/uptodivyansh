export default async function handler(req, res) {
    const { client_txn_id } = req.query;

    if (!client_txn_id) {
        return res.status(400).json({ status: false, message: 'Transaction ID is required' });
    }

    try {
        // UPIGateway Status API
        const payload = {
            key: "fdde97dc-7bad-4f7e-b1a3-d93ee24a5d21", // Your Merchant Key
            client_txn_id: client_txn_id
        };

        const response = await fetch('https://api.ekqr.in/api/check_order_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.status && result.data && result.data.status === 'success') {
            return res.status(200).json({ 
                status: true, 
                message: 'Verified',
                download_ready: true 
            });
        } else {
            return res.status(200).json({ 
                status: false, 
                message: result.msg || 'Payment Pending or Failed',
                original_status: result.data ? result.data.status : 'unknown'
            });
        }
    } catch (error) {
        console.error('Verification Error:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}
