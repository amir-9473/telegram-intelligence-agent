'use strict';

const { normalizeChannel } = require('./telegram-parser');

const HELP = 'دستورها: /add @channel، /remove @channel، /list، /latest @channel [hours] [min_views]، /ask سؤال، /digest، /alert add keyword، /alert list، /alert remove ALERT_ID';

function invalid(message) {
  return { action: 'reply', reply: message };
}

function parseCommand(text, chatId = null, userId = null) {
  const raw = String(text || '').trim();
  const parts = raw.split(/\s+/);
  const command = (parts.shift() || '').split('@')[0].toLowerCase();
  const base = { chat_id: String(chatId ?? ''), user_id: String(userId ?? chatId ?? '') };

  if (command === '/start') return { ...base, action: 'reply', reply: `سلام! من کانال‌های عمومی تلگرام را پایش می‌کنم.\n\n${HELP}` };
  if (command === '/help') return { ...base, action: 'reply', reply: HELP };
  if (command === '/list') return parts.length ? invalid('فرمت درست: /list') : { ...base, action: 'list' };
  if (command === '/digest') return parts.length ? invalid('فرمت درست: /digest') : { ...base, action: 'digest' };

  if (command === '/add' || command === '/remove') {
    if (parts.length !== 1) return invalid(`فرمت درست: ${command} @channel`);
    const channel = normalizeChannel(parts[0]);
    if (!channel) return invalid('نام کانال معتبر نیست؛ نمونه: @telegram');
    return { ...base, action: command.slice(1), channel_username: channel };
  }

  if (command === '/latest') {
    if (parts.length < 1 || parts.length > 3) return invalid('فرمت درست: /latest @channel [hours] [min_views]');
    const channel = normalizeChannel(parts[0]);
    const hours = parts[1] === undefined ? 24 : Number(parts[1]);
    const minViews = parts[2] === undefined ? 0 : Number(parts[2]);
    if (!channel) return invalid('نام کانال معتبر نیست؛ نمونه: @telegram');
    if (!Number.isInteger(hours) || hours < 1 || hours > 720) return invalid('ساعت باید عددی بین ۱ تا ۷۲۰ باشد.');
    if (!Number.isInteger(minViews) || minViews < 0) return invalid('حداقل بازدید باید عدد صحیح و نامنفی باشد.');
    return { ...base, action: 'latest', channel_username: channel, hours, min_views: minViews };
  }

  if (command === '/ask') {
    const question = parts.join(' ').trim();
    return question.length >= 3 ? { ...base, action: 'ask', question } : invalid('پس از /ask یک سؤال روشن بنویسید.');
  }

  if (command === '/alert') {
    const sub = (parts.shift() || '').toLowerCase();
    if (sub === 'list' && parts.length === 0) return { ...base, action: 'alert_list' };
    if (sub === 'add') {
      const keyword = parts.join(' ').trim();
      return keyword.length >= 2 && keyword.length <= 80
        ? { ...base, action: 'alert_add', keyword }
        : invalid('فرمت درست: /alert add keyword (۲ تا ۸۰ نویسه)');
    }
    if (sub === 'remove' && parts.length === 1 && /^[a-z0-9-]{6,64}$/i.test(parts[0])) {
      return { ...base, action: 'alert_remove', alert_id: parts[0] };
    }
    return invalid('فرمت درست: /alert add keyword | /alert list | /alert remove ALERT_ID');
  }

  return invalid(`دستور شناخته نشد.\n${HELP}`);
}

module.exports = { HELP, parseCommand };

