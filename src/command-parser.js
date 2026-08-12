'use strict';

const { normalizeChannel } = require('./telegram-parser');

const HELP = [
  'Welcome to Telegram Intelligence Agent!',
  '',
  'This bot monitors public Telegram channels and summarizes important posts.',
  '',
  'Commands:',
  '',
  '/add @channel',
  'Add a public channel',
  '',
  '/remove @channel',
  'Stop monitoring a channel',
  '',
  '/list',
  'Show active channels',
  '',
  '/latest @channel [hours] [min_views]',
  'Show recent posts',
  '',
  '/ask your question',
  'Ask about collected posts',
  '',
  '/digest',
  'Get the latest 24-hour digest',
  '',
  '/alert add keyword',
  'Create a keyword alert',
  '',
  '/alert list',
  'Show your alerts',
  '',
  '/alert remove ALERT_ID',
  'Remove an alert',
].join('\n');

function invalid(message) {
  return { action: 'reply', reply: message };
}

function parseCommand(text, chatId = null, userId = null) {
  const raw = String(text || '').trim();
  const parts = raw.split(/\s+/);
  const command = (parts.shift() || '').split('@')[0].toLowerCase();
  const base = { chat_id: String(chatId ?? ''), user_id: String(userId ?? chatId ?? '') };

  if (command === '/start') return { ...base, action: 'reply', reply: HELP };
  if (command === '/help') return { ...base, action: 'reply', reply: HELP };
  if (command === '/list') return parts.length ? invalid('Correct format: /list') : { ...base, action: 'list' };
  if (command === '/digest') return parts.length ? invalid('Correct format: /digest') : { ...base, action: 'digest' };

  if (command === '/add' || command === '/remove') {
    if (parts.length !== 1) return invalid(`Correct format: ${command} @channel`);
    const channel = normalizeChannel(parts[0]);
    if (!channel) return invalid('Invalid public channel username. Example: @telegram');
    return { ...base, action: command.slice(1), channel_username: channel };
  }

  if (command === '/latest') {
    if (parts.length < 1 || parts.length > 3) return invalid('Correct format: /latest @channel [hours] [min_views]');
    const channel = normalizeChannel(parts[0]);
    const hours = parts[1] === undefined ? 24 : Number(parts[1]);
    const minViews = parts[2] === undefined ? 0 : Number(parts[2]);
    if (!channel) return invalid('Invalid public channel username. Example: @telegram');
    if (!Number.isInteger(hours) || hours < 1 || hours > 720) return invalid('Hours must be an integer between 1 and 720.');
    if (!Number.isInteger(minViews) || minViews < 0) return invalid('Minimum views must be a non-negative integer.');
    return { ...base, action: 'latest', channel_username: channel, hours, min_views: minViews };
  }

  if (command === '/ask') {
    const question = parts.join(' ').trim();
    return question.length >= 3 ? { ...base, action: 'ask', question } : invalid('Write a clear question after /ask.');
  }

  if (command === '/alert') {
    const sub = (parts.shift() || '').toLowerCase();
    if (sub === 'list' && parts.length === 0) return { ...base, action: 'alert_list' };
    if (sub === 'add') {
      const keyword = parts.join(' ').trim();
      return keyword.length >= 2 && keyword.length <= 80
        ? { ...base, action: 'alert_add', keyword }
        : invalid('Correct format: /alert add keyword (2 to 80 characters)');
    }
    if (sub === 'remove' && parts.length === 1 && /^[a-z0-9-]{6,64}$/i.test(parts[0])) {
      return { ...base, action: 'alert_remove', alert_id: parts[0] };
    }
    return invalid('Correct format: /alert add keyword | /alert list | /alert remove ALERT_ID');
  }

  return invalid(HELP);
}

module.exports = { HELP, parseCommand };
