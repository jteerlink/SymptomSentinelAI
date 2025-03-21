/**
 * SMS Notification Utility
 * 
 * This utility handles sending SMS notifications for important events
 * using the Twilio API.
 */

const twilio = require('twilio');

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Send an SMS notification using Twilio
 * 
 * @param {string} toPhoneNumber - The recipient's phone number in E.164 format
 * @param {string} message - The message to send
 * @returns {Promise<Object>} The Twilio message response
 * @throws {Error} If sending fails
 */
async function sendSmsNotification(toPhoneNumber, message) {
    try {
        // Check for required environment variables
        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
            throw new Error('Missing Twilio credentials in environment variables');
        }
        
        // Initialize Twilio client
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        
        // Send the message
        const response = await client.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to: toPhoneNumber
        });
        
        console.log(`SMS notification sent to ${toPhoneNumber} with SID: ${response.sid}`);
        return response;
    } catch (error) {
        console.error('Failed to send SMS notification:', error);
        throw error;
    }
}

/**
 * Send a notification about a new analysis result
 * 
 * @param {string} toPhoneNumber - The recipient's phone number
 * @param {Object} analysisResult - The analysis result object
 * @returns {Promise<Object>} The Twilio message response
 */
async function sendAnalysisNotification(toPhoneNumber, analysisResult) {
    const { type, conditions } = analysisResult;
    const topCondition = conditions[0] || { name: 'Unknown', confidence: 0 };
    
    const message = `
        SymptomSentryAI Analysis Result:
        Type: ${type.charAt(0).toUpperCase() + type.slice(1)}
        Top condition: ${topCondition.name} (${Math.round(topCondition.confidence * 100)}% confidence)
        Login to your account to view the full analysis.
    `.trim().replace(/\n\s+/g, '\n');
    
    return sendSmsNotification(toPhoneNumber, message);
}

module.exports = {
    sendSmsNotification,
    sendAnalysisNotification
};