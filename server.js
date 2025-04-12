const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const token = '7376652915:AAGqwHaHBRmxd6ZcCt9mmT_lg1kstFsgpj8';
const bot = new TelegramBot(token);
const WEBHOOK_PATH = '/bot';
const WEBHOOK_URL = 'https://manifest-34oy.onrender.com' + WEBHOOK_PATH;
const MODERATOR_ID = '743820908';
const APP_URL = 'https://t.me/XpayTONbot';

app.use(express.json());
app.post(WEBHOOK_PATH, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

bot.setWebHook(WEBHOOK_URL).then(() => {
    console.log(`Webhook встановлено на ${WEBHOOK_URL}`);
});

const projects = {};
const states = {};
const languages = {};
const TIMEOUT_MINUTES = 10;

// Validation functions
const validateName = (name) => /^[a-zA-Z0-9\s\-_]{3,50}$/.test(name);
const validateLink = (link) => /^(https?:\/\/|t\.me\/)[a-zA-Z0-9\/\-\_\.]+$/.test(link);
const validateDescription = (desc) => desc.length >= 10 && desc.length <= 500;
const validateReward = (reward) => !isNaN(reward) && reward >= 0.1 && reward <= 1000;
const validateTokenReward = (reward) => !isNaN(reward) && reward >= 0;
const validateDate = (dateStr) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    const now = new Date();
    return date > now && !isNaN(date);
};
const validateContact = (contact) => /^[a-zA-Z0-9\s@\.]{3,50}$/.test(contact);

// Localized messages
const messages = {
    uk: {
        welcome: "👋 Вітаю! Ви розпочали створення нового проекту на XPAY Маркет.\n📌 Вкажіть назву вашого проекту (3-50 символів, лише літери, цифри, пробіли, -, _):",
        invalidName: "❌ Назва некоректна! Використовуйте 3-50 символів (літери, цифри, пробіли, -, _). Спробуйте ще раз:",
        linkPrompt: "🔗 Дякую! Вкажіть посилання на ваш проект (наприклад, 't.me/MyProject' або 'https://site.com'):",
        invalidLink: "❌ Некоректне посилання! Використовуйте формат 't.me/...' або 'https://...'. Спробуйте ще раз:",
        descriptionPrompt: "📝 Чудово! Надайте короткий опис вашого проекту (10-500 символів):",
        invalidDescription: "❌ Опис має бути 10-500 символів! Спробуйте ще раз:",
        rewardPrompt: "💰 Яка буде нагорода для учасників у TON? (0.1–1000 TON):",
        invalidReward: "❌ Вкажіть коректну нагороду (0.1–1000 TON)! Спробуйте ще раз:",
        tokenPrompt: "🏷 Чи є у вашого проекту власний токен? Вкажіть його назву (наприклад, 'Xpay') або 'N/A':",
        tokenRewardPrompt: "🔢 Вкажіть кількість токенів для нагороди (наприклад, '1000' або '0', якщо токена немає):",
        invalidTokenReward: "❌ Вкажіть коректну кількість токенів (0 або більше)! Спробуйте ще раз:",
        contactPrompt: "📞 Вкажіть контакт для зв’язку (наприклад, '@YourNick' або 'email@example.com'):",
        invalidContact: "❌ Некоректний контакт! Використовуйте 3-50 символів (літери, цифри, @, .). Спробуйте ще раз:",
        categoryPrompt: "📂 До якої категорії належить ваш проект?\n• Airdrop – роздача токенів\n• Task – завдання для учасників\n• Game – ігровий проект",
        categorySelected: (cat) => `📂 Ви обрали категорію: ${cat}.\n📅 Вкажіть дату закінчення проекту (формат: YYYY-MM-DD, наприклад, '2025-12-31'):`,
        invalidDate: "❌ Вкажіть дату у форматі YYYY-MM-DD, яка є майбутньою (наприклад, '2025-12-31')!",
        imagePrompt: "🖼 (Опціонально) Надішліть логотип або банер вашого проекту (фото) або напишіть 'N/A' для пропуску:",
        confirmPrompt: "📋 Перегляньте дані вашого проекту:\n\n{summary}\n\nВсе правильно?",
        success: "✅ Ваш проект успішно відправлено на модерацію!\n\n{summary}",
        moderation: "🔔 Новий проект на модерацію:\n\n{summary}",
        cancel: "❌ Процес створення проекту скасовано.",
        timeout: "⏰ Час очікування минув. Почніть заново за допомогою /start.",
        editPrompt: "✏️ Виберіть поле для редагування (name, link, description, reward, token, tokenReward, contact, image, category, expirationDate):",
        langPrompt: "🌐 Оберіть мову:"
    },
    en: {
        welcome: "👋 Welcome! You’ve started creating a new project on XPAY Market.\n📌 Please provide the project name (3-50 characters, letters, numbers, spaces, -, _ only):",
        invalidName: "❌ Invalid name! Use 3-50 characters (letters, numbers, spaces, -, _). Try again:",
        linkPrompt: "🔗 Thanks! Provide a link to your project (e.g., 't.me/MyProject' or 'https://site.com'):",
        invalidLink: "❌ Invalid link! Use format 't.me/...' or 'https://...'. Try again:",
        descriptionPrompt: "📝 Great! Provide a short description of your project (10-500 characters):",
        invalidDescription: "❌ Description must be 10-500 characters! Try again:",
        rewardPrompt: "💰 What will be the reward for participants in TON? (0.1–1000 TON):",
        invalidReward: "❌ Please provide a valid reward (0.1–1000 TON)! Try again:",
        tokenPrompt: "🏷 Does your project have its own token? Provide its name (e.g., 'Xpay') or type 'N/A':",
        tokenRewardPrompt: "🔢 Specify the number of tokens for the reward (e.g., '1000' or '0' if no token):",
        invalidTokenReward: "❌ Please specify a valid number of tokens (0 or more)! Try again:",
        contactPrompt: "📞 Provide a contact for communication (e.g., '@YourNick' or 'email@example.com'):",
        invalidContact: "❌ Invalid contact! Use 3-50 characters (letters, numbers, @, .). Try again:",
        categoryPrompt: "📂 Which category does your project belong to?\n• Airdrop – token distribution\n• Task – tasks for participants\n• Game – gaming project",
        categorySelected: (cat) => `📂 You selected category: ${cat}.\n📅 Specify the project’s end date (format: YYYY-MM-DD, e.g., '2025-12-31'):`,
        invalidDate: "❌ Please provide a future date in YYYY-MM-DD format (e.g., '2025-12-31')!",
        imagePrompt: "🖼 (Optional) Send a logo or banner for your project (photo) or type 'N/A' to skip:",
        confirmPrompt: "📋 Review your project details:\n\n{summary}\n\nIs everything correct?",
        success: "✅ Your project has been successfully submitted for moderation!\n\n{summary}",
        moderation: "🔔 New project for moderation:\n\n{summary}",
        cancel: "❌ Project creation process canceled.",
        timeout: "⏰ Time limit exceeded. Start over with /start.",
        editPrompt: "✏️ Select a field to edit (name, link, description, reward, token, tokenReward, contact, image, category, expirationDate):",
        langPrompt: "🌐 Please choose your language:"
    }
};

// Language selection command
bot.onText(/\/lang/, (msg) => {
    const userId = msg.from.id.toString();
    bot.sendMessage(msg.chat.id, messages.en.langPrompt, {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Українська", callback_data: `lang_${userId}_uk` }],
                [{ text: "English", callback_data: `lang_${userId}_en` }]
            ]
        }
    });
});

// Start project creation
bot.onText(/\/start add_project_(.+)/, (msg, match) => {
    const userId = match[1];
    projects[userId] = { telegramAccountId: userId };
    states[userId] = { step: 'language', lastActivity: Date.now() };

    bot.sendMessage(msg.chat.id, messages.en.langPrompt, {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Українська", callback_data: `lang_${userId}_uk` }],
                [{ text: "English", callback_data: `lang_${userId}_en` }]
            ]
        }
    });
});

// Handle text and photo messages
bot.on('message', async (msg) => {
    const userId = msg.from.id.toString();
    if (!projects[userId] || !states[userId] || msg.text?.startsWith('/')) return;

    const state = states[userId];
    const lang = languages[userId] || 'uk';
    state.lastActivity = Date.now();

    switch (state.step) {
        case 'name':
            const name = msg.text?.trim();
            if (!validateName(name)) {
                bot.sendMessage(msg.chat.id, messages[lang].invalidName, getCancelButton(userId));
                return;
            }
            projects[userId].name = name;
            state.step = 'link';
            bot.sendMessage(msg.chat.id, messages[lang].linkPrompt, getCancelButton(userId));
            break;

        case 'link':
            const link = msg.text?.trim();
            if (!validateLink(link)) {
                bot.sendMessage(msg.chat.id, messages[lang].invalidLink, getCancelButton(userId));
                return;
            }
            projects[userId].link = link;
            state.step = 'description';
            bot.sendMessage(msg.chat.id, messages[lang].descriptionPrompt, getCancelButton(userId));
            break;

        case 'description':
            const description = msg.text?.trim();
            if (!validateDescription(description)) {
                bot.sendMessage(msg.chat.id, messages[lang].invalidDescription, getCancelButton(userId));
                return;
            }
            projects[userId].description = description;
            state.step = 'reward';
            bot.sendMessage(msg.chat.id, messages[lang].rewardPrompt, getCancelButton(userId));
            break;

        case 'reward':
            const reward = parseFloat(msg.text);
            if (!validateReward(reward)) {
                bot.sendMessage(msg.chat.id, messages[lang].invalidReward, getCancelButton(userId));
                return;
            }
            projects[userId].reward = reward;
            state.step = 'token';
            bot.sendMessage(msg.chat.id, messages[lang].tokenPrompt, getCancelButton(userId));
            break;

        case 'token':
            const tokenName = msg.text?.trim();
            projects[userId].tokenName = tokenName === 'N/A' ? null : tokenName;
            state.step = 'tokenReward';
            bot.sendMessage(msg.chat.id, messages[lang].tokenRewardPrompt, getCancelButton(userId));
            break;

        case 'tokenReward':
            const tokenReward = parseInt(msg.text);
            if (!validateTokenReward(tokenReward)) {
                bot.sendMessage(msg.chat.id, messages[lang].invalidTokenReward, getCancelButton(userId));
                return;
            }
            projects[userId].tokenReward = tokenReward;
            state.step = 'contact';
            bot.sendMessage(msg.chat.id, messages[lang].contactPrompt, getCancelButton(userId));
            break;

        case 'contact':
            const contact = msg.text?.trim();
            if (!validateContact(contact)) {
                bot.sendMessage(msg.chat.id, messages[lang].invalidContact, getCancelButton(userId));
                return;
            }
            projects[userId].contact = contact;
            state.step = 'image';
            bot.sendMessage(msg.chat.id, messages[lang].imagePrompt, getCancelButton(userId));
            break;

        case 'image':
            if (msg.text?.trim() === 'N/A') {
                projects[userId].image = null;
                state.step = 'category';
                bot.sendMessage(msg.chat.id, messages[lang].categoryPrompt, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Airdrop", callback_data: `category_${userId}_airdrop` }],
                            [{ text: "Task", callback_data: `category_${userId}_task` }],
                            [{ text: "Game", callback_data: `category_${userId}_game` }],
                            [{ text: "🚫 Скасувати / Cancel", callback_data: `cancel_${userId}` }]
                        ]
                    }
                });
            } else if (msg.photo) {
                const fileId = msg.photo[msg.photo.length - 1].file_id;
                const file = await bot.getFile(fileId);
                projects[userId].image = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
                state.step = 'category';
                bot.sendMessage(msg.chat.id, messages[lang].categoryPrompt, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Airdrop", callback_data: `category_${userId}_airdrop` }],
                            [{ text: "Task", callback_data: `category_${userId}_task` }],
                            [{ text: "Game", callback_data: `category_${userId}_game` }],
                            [{ text: "🚫 Скасувати / Cancel", callback_data: `cancel_${userId}` }]
                        ]
                    }
                });
            } else {
                bot.sendMessage(msg.chat.id, messages[lang].imagePrompt, getCancelButton(userId));
            }
            break;

        case 'expirationDate':
            const expirationDate = msg.text?.trim();
            if (!validateDate(expirationDate)) {
                bot.sendMessage(msg.chat.id, messages[lang].invalidDate, getCancelButton(userId));
                return;
            }
            projects[userId].expirationDate = expirationDate;
            state.step = 'confirm';
            showConfirmation(msg.chat.id, userId, lang);
            break;

        case 'edit':
            const field = msg.text?.trim();
            if (!['name', 'link', 'description', 'reward', 'token', 'tokenReward', 'contact', 'image', 'category', 'expirationDate'].includes(field)) {
                bot.sendMessage(msg.chat.id, messages[lang].editPrompt, getCancelButton(userId));
                return;
            }
            state.step = field;
            bot.sendMessage(msg.chat.id, messages[lang][`${field}Prompt`] || `Please provide a new value for ${field}:`, getCancelButton(userId));
            break;
    }
});

// Handle callback queries
bot.on('callback_query', async (query) => {
    const [action, userId, value] = query.data.split('_');
    if (!projects[userId] || !states[userId]) return;

    const lang = languages[userId] || 'uk';
    states[userId].lastActivity = Date.now();

    if (action === 'lang') {
        languages[userId] = value;
        if (states[userId].step === 'language') {
            states[userId].step = 'name';
            bot.editMessageText(messages[value].welcome, {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                reply_markup: {
                    inline_keyboard: [[{ text: "🚫 Скасувати / Cancel", callback_data: `cancel_${userId}` }]]
                }
            });
        } else {
            bot.editMessageText(messages[value].langPrompt, {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id
            });
        }
        return;
    }

    if (action === 'cancel') {
        bot.editMessageText(messages[lang].cancel, {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id
        });
        delete projects[userId];
        delete states[userId];
        delete languages[userId];
        return;
    }

    if (action === 'category') {
        projects[userId].category = value;
        states[userId].step = 'expirationDate';
        bot.editMessageText(messages[lang].categorySelected(value), {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            reply_markup: {
                inline_keyboard: [[{ text: "🚫 Скасувати / Cancel", callback_data: `cancel_${userId}` }]]
            }
        });
    }

    if (action === 'confirm') {
        if (value === 'yes') {
            projects[userId].status = "pending";
            projects[userId].submittedBy = userId;
            projects[userId].createdAt = new Date().toISOString();

            bot.editMessageText(messages[lang].success.replace('{summary}', formatProjectSummary(projects[userId], lang)), {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                reply_markup: {
                    inline_keyboard: [[
                        { text: lang === 'uk' ? "🚀 Перейти в додаток" : "🚀 Go to app", url: `${APP_URL}?telegram_account_id=${userId}` }
                    ]]
                }
            });

            bot.sendMessage(MODERATOR_ID, messages[lang].moderation.replace('{summary}', formatProjectSummary(projects[userId], lang)));

            try {
                await saveCompanyToServer(projects[userId]);
            } catch (error) {
                bot.sendMessage(userId, messages[lang].timeout);
                bot.sendMessage(MODERATOR_ID, "❌ Error saving project from user " + userId);
            }

            delete projects[userId];
            delete states[userId];
            delete languages[userId];
        } else if (value === 'edit') {
            states[userId].step = 'edit';
            bot.editMessageText(messages[lang].editPrompt, {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                reply_markup: getCancelButton(userId)
            });
        } else {
            bot.editMessageText(messages[lang].cancel, {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id
            });
            delete projects[userId];
            delete states[userId];
            delete languages[userId];
        }
    }
});

// Format project summary
function formatProjectSummary(project, lang) {
    return `${lang === 'uk' ? 'Назва' : 'Name'}: ${project.name}\n` +
           `${lang === 'uk' ? 'Посилання' : 'Link'}: ${project.link}\n` +
           `${lang === 'uk' ? 'Опис' : 'Description'}: ${project.description}\n` +
           `${lang === 'uk' ? 'Нагорода' : 'Reward'}: ${project.reward} TON\n` +
           `${lang === 'uk' ? 'Токен' : 'Token'}: ${project.tokenName || 'N/A'}\n` +
           `${lang === 'uk' ? 'Кількість токенів' : 'Token amount'}: ${project.tokenReward}\n` +
           `${lang === 'uk' ? 'Контакт' : 'Contact'}: ${project.contact}\n` +
           `${lang === 'uk' ? 'Зображення' : 'Image'}: ${project.image || 'N/A'}\n` +
           `${lang === 'uk' ? 'Категорія' : 'Category'}: ${project.category}\n` +
           `${lang === 'uk' ? 'Дата закінчення' : 'End date'}: ${project.expirationDate}`;
}

// Show confirmation
function showConfirmation(chatId, userId, lang) {
    bot.sendMessage(chatId, messages[lang].confirmPrompt.replace('{summary}', formatProjectSummary(projects[userId], lang)), {
        reply_markup: {
            inline_keyboard: [
                [{ text: lang === 'uk' ? "✅ Підтвердити" : "✅ Confirm", callback_data: `confirm_${userId}_yes` }],
                [{ text: lang === 'uk' ? "✏️ Редагувати" : "✏️ Edit", callback_data: `confirm_${userId}_edit` }],
                [{ text: lang === 'uk' ? "❌ Скасувати" : "❌ Cancel", callback_data: `confirm_${userId}_no` }]
            ]
        }
    });
}

// Cancel button
function getCancelButton(userId) {
    return {
        reply_markup: {
            inline_keyboard: [[{ text: "🚫 Скасувати / Cancel", callback_data: `cancel_${userId}` }]]
        }
    };
}

// Save to server
async function saveCompanyToServer(company) {
    try {
        const response = await fetch('https://hryvnia-5.onrender.com/api/save-company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(company)
        });
        if (!response.ok) throw new Error('Failed to save');
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Timeout for inactive sessions
setInterval(() => {
    const now = Date.now();
    for (const userId in states) {
        if (now - states[userId].lastActivity > TIMEOUT_MINUTES * 60 * 1000) {
            const lang = languages[userId] || 'uk';
            bot.sendMessage(userId, messages[lang].timeout);
            delete projects[userId];
            delete states[userId];
            delete languages[userId];
        }
    }
}, 60 * 1000);

const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Бот запущено на порту ${port}`);
});