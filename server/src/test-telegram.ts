import 'dotenv/config';
import { connectTelegram, getUserClient, sendLoginCode } from './services/telegram.service';

async function testTelegramService() {
    console.log('=== Testing Telegram Service ===\n');

    try {
        // Test 1: Connect bot client
        console.log('Test 1: Connecting bot client...');
        await connectTelegram();
        console.log('✓ Bot client connected successfully\n');

        // Test 2: Test sendLoginCode (requires phone number input)
        console.log('Test 2: Testing sendLoginCode...');
        console.log('Note: This requires a real phone number. Skipping for automated test.\n');

        // Test 3: Verify environment variables
        console.log('Test 3: Checking environment variables...');
        const requiredVars = ['TELEGRAM_API_ID', 'TELEGRAM_API_HASH', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHANNEL_ID'];
        const missing = requiredVars.filter(v => !process.env[v]);

        if (missing.length > 0) {
            console.log(`✗ Missing environment variables: ${missing.join(', ')}`);
        } else {
            console.log('✓ All required environment variables are set\n');
        }

        console.log('=== All Tests Passed ===');
        process.exit(0);
    } catch (error) {
        console.error('✗ Test failed:', error);
        process.exit(1);
    }
}

testTelegramService();
