const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');

const TELEGRAM_BOT_TOKEN = ''; //your bot token
const TELEGRAM_CHAT_ID = ''; //your chat id
const TRON_WALLET_ADDRESS = ''; //your wallet address
const CHECK_INTERVAL = 10000; //interval in milliseconds


const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/myid/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Your chat ID is: ${chatId}`);
});

async function checkTransfers() {
    try {
        console.log('Checking transfers...');
        const response = await fetch(`https://api.trongrid.io/v1/accounts/${TRON_WALLET_ADDRESS}/transactions/trc20?contractAddress=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t&only_to=true&only_confirmed=true&limit=10&sort=-timestamp`);
        const data = await response.json();

        if (!data.success) {
            console.error('Error checking transfers:', data.error);
            return;
        }

        const transfers = data.data;
        console.log('Found transfers:', transfers);

        if (transfers.length > 0) {
            const messages = transfers.map(transfer => {
                const amount = transfer.token_info.decimals ? transfer.value / Math.pow(10, transfer.token_info.decimals) : transfer.value;
                const fromAddress = transfer.from;
                const toAddress = transfer.to;
                const txID = transfer.transaction_id;

                let message = `New USDT transfer:\nAmount: ${amount} USDT\n`;

                if (fromAddress === TRON_WALLET_ADDRESS) {
                    message += `Sent to: ${toAddress}`;
                } else if (toAddress === TRON_WALLET_ADDRESS) {
                    message += `Received from: ${fromAddress}`;
                }

                message += `\nTxID: ${txID}`;
                return message;
            });

            console.log('Sending messages:', messages);
            await Promise.all(messages.map(msg => sendTelegramMessage(msg)));
        } else {
            console.log('No transfers found.');
        }
    } catch (error) {
        console.error('Error checking transfers:', error);
    }
}

async function sendTelegramMessage(message) {
    try {
        console.log('Sending message to Telegram...');
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message
            })
        });
        const result = await response.json();
        console.log('Message sending result:', result);
    } catch (error) {
        console.error('Error sending message to Telegram:', error);
    }
}

setInterval(checkTransfers, CHECK_INTERVAL);