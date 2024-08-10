const axios = require('axios');
const OTP_EXPIRATION = 300; // 5 minutes

const phoneOtps = new Map();

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
}

function storeOtp(map, identifier, otp) {
    const expiration = Date.now() + OTP_EXPIRATION * 1000;
    map.set(identifier, { otp, expiration });
}

function verifyOtp(map, identifier, otp) {
    const otpData = map.get(identifier);
    if (!otpData || otpData.otp !== otp || otpData.expiration < Date.now()) {
        return false;
    }
    map.delete(identifier); // Remove OTP after successful verification
    return true;
}

async function sendPhoneOtp(req, res) {
    const { identifier } = req.body; // assuming 'identifier' is the phone number
    const otp = generateOtp();
    storeOtp(phoneOtps, identifier, otp);

    const data = {
        variables_values: otp,
        route: 'otp',
        numbers: identifier,
    };

    const options = {
        headers: {
            'authorization': process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json'
        }
    };

    try {
        console.log(`Sending OTP to ${identifier}`);
        console.log('Request data:', data);
        const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', data, options);
        console.log('Response from Fast2SMS:', response.data);
        if (response.data.return) {
            res.status(200).json({ message: 'OTP sent to phone.' });
        } else {
            res.status(500).json({ error: 'Failed to send OTP via SMS.', details: response.data });
        }
    } catch (error) {
        console.error('Error sending OTP:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to send OTP via SMS.' });
    }
}

function verifyPhoneOtp(req, res) {
    const { identifier, otp } = req.body;
    const isValid = verifyOtp(phoneOtps, identifier, otp);
    if (isValid) {
        res.status(200).json({ message: 'Phone OTP verified.' });
    } else {
        res.status(400).json({ error: 'Invalid or expired phone OTP.' });
    }
}

module.exports = {
    sendPhoneOtp,
    verifyPhoneOtp,
};
