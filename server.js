const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

const token = '7376652915:AAGqwHaHBRmxd6ZcCt9mmT_lg1kstFsgpj8';
const bot = new TelegramBot(token);

const WEBHOOK_PATH = '/bot';
const WEBHOOK_URL = 'https://manifest-34oy.onrender.com' + WEBHOOK_PATH; // Замініть на ваш реальний URL від Render

app.use(express.json());
app.post(WEBHOOK_PATH, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

bot.setWebHook(WEBHOOK_URL).then(() => {
    console.log(`Webhook встановлено на ${WEBHOOK_URL}`);
});

const projects = {};
const MODERATOR_ID = '743820908';
const APP_URL = "https://t.me/XpayTONbot";

bot.onText(/\/start add_project_(.+)/, (msg, match) => {
    const userId = match[1];
    projects[userId] = {};
    projects[userId].telegramAccountId = userId;
    bot.sendMessage(msg.chat.id, "👋 Вітаю! Ви розпочали процес створення нового проекту на XPAY Маркет.\n" +
        "Будь ласка, вкажіть назву вашого проекту (наприклад, 'My Cool Project'):");
});

bot.on('message', async (msg) => {
    const userId = msg.from.id.toString();
    if (!projects[userId] || msg.text.startsWith('/')) return;

    const step = Object.keys(projects[userId]).length - 1;
    switch (step) {
        case 0:
            projects[userId].name = msg.text;
            bot.sendMessage(msg.chat.id, "🔗 Дякую! Тепер вкажіть посилання на ваш проект.\n" +
                "Це може бути Telegram-канал, сайт або інше (наприклад, 't.me/MyProject'):");
            break;
        case 1:
            projects[userId].link = msg.text;
            bot.sendMessage(msg.chat.id, "📝 Чудово! Надайте короткий опис вашого проекту.\n" +
                "Опишіть, що потрібно зробити користувачам для участі (наприклад, 'Підпишіться на канал і отримайте нагороду'):");
            break;
        case 2:
            projects[userId].description = msg.text;
            bot.sendMessage(msg.chat.id, "💰 Чудово! Яка буде нагорода для учасників у TON?\n" +
                "Вкажіть числове значення (наприклад, '5' для 5 TON):");
            break;
        case 3:
            projects[userId].reward = parseFloat(msg.text);
            if (isNaN(projects[userId].reward) || projects[userId].reward <= 0) {
                bot.sendMessage(msg.chat.id, "❌ Будь ласка, вкажіть коректну числову нагороду в TON (наприклад, '5')!");
                return;
            }
            bot.sendMessage(msg.chat.id, "🏷 Чи є у вашого проекту власний токен?\n" +
                "Вкажіть його назву (наприклад, 'XYZ') або напишіть 'N/A', якщо токена немає:");
            break;
        case 4:
            projects[userId].tokenName = msg.text === 'N/A' ? null : msg.text;
            bot.sendMessage(msg.chat.id, "🔢 Якщо у вас є токен, вкажіть кількість токенів для нагороди.\n" +
                "Напишіть число (наприклад, '1000') або '0', якщо токена немає:");
            break;
        case 5:
            projects[userId].tokenReward = parseInt(msg.text) || 0;
            if (isNaN(projects[userId].tokenReward) || projects[userId].tokenReward < 0) {
                bot.sendMessage(msg.chat.id, "❌ Будь ласка, вкажіть коректну кількість токенів (наприклад, '1000' або '0')!");
                return;
            }
            bot.sendMessage(msg.chat.id, "📂 До якої категорії належить ваш проект?\n" +
                "Оберіть одну з опцій нижче:", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Airdrop", callback_data: `category_${userId}_airdrop` }],
                        [{ text: "Task", callback_data: `category_${userId}_task` }],
                        [{ text: "Game", callback_data: `category_${userId}_game` }]
                    ]
                }
            });
            break;
        case 6:
            projects[userId].expirationDate = msg.text;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(projects[userId].expirationDate)) {
                bot.sendMessage(msg.chat.id, "❌ Вкажіть дату у правильному форматі: YYYY-MM-DD (наприклад, '2025-12-31')!");
                return;
            }
            projects[userId].status = "pending";
            projects[userId].submittedBy = userId;
            projects[userId].createdAt = new Date().toISOString();

            bot.sendMessage(msg.chat.id, "✅ Ваш проект успішно створено та відправлено на модерацію!\n\n" +
                `Назва: ${projects[userId].name}\n` +
                `Посилання: ${projects[userId].link}\n` +
                `Опис: ${projects[userId].description}\n` +
                `Нагорода: ${projects[userId].reward} TON\n` +
                `Токен: ${projects[userId].tokenName || 'N/A'}\n` +
                `Кількість токенів: ${projects[userId].tokenReward}\n` +
                `Категорія: ${projects[userId].category}\n` +
                `Дата закінчення: ${projects[userId].expirationDate}\n\n` +
                "Перейдіть у додаток, щоб переглянути статус:", {
                reply_markup: {
                    inline_keyboard: [[
                        { text: "🚀 Перейти в додаток", url: `${APP_URL}?telegram_account_id=${userId}` }
                    ]]
                }
            });

            bot.sendMessage(MODERATOR_ID, "🔔 Новий проект на модерацію:\n\n" +
                `Назва: ${projects[userId].name}\n` +
                `Посилання: ${projects[userId].link}\n` +
                `Опис: ${projects[userId].description}\n` +
                `Нагорода: ${projects[userId].reward} TON\n` +
                `Токен: ${projects[userId].tokenName || 'N/A'}\n` +
                `Кількість токенів: ${projects[userId].tokenReward}\n` +
                `Категорія: ${projects[userId].category}\n` +
                `Дата закінчення: ${projects[userId].expirationDate}\n` +
                `Відправлено користувачем: ${projects[userId].submittedBy}`);

            await saveCompanyToServer(projects[userId]);
            delete projects[userId];
            break;
    }
});

bot.on('callback_query', async (query) => {
    const [action, userId, value] = query.data.split('_');
    if (action === 'category' && projects[userId]) {
        projects[userId].category = value;
        bot.editMessageText("📂 Ви обрали категорію: " + value + ".\n" +
            "Останній крок! Вкажіть дату закінчення проекту.\n" +
            "Формат: YYYY-MM-DD (наприклад, '2025-12-31'):", {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id
        });
    }
});

async function saveCompanyToServer(company) {
    try {
        const response = await fetch('https://hryvnia-5.onrender.com/api/save-company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(company)
        });
        if (!response.ok) throw new Error('Помилка збереження');
    } catch (error) {
        console.error('Помилка:', error);
        bot.sendMessage(company.submittedBy, "❌ Виникла помилка при збереженні проекту!");
        bot.sendMessage(MODERATOR_ID, "❌ Помилка при збереженні проекту від користувача " + company.submittedBy);
    }
}

const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Бот запущено на порту ${port}`);
});