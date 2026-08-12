'use strict';

function decodeHtml(value = '') {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return String(value).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, entity) => {
    if (entity[0] === '#') {
      const hex = entity[1].toLowerCase() === 'x';
      const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    }
    return named[entity.toLowerCase()] ?? '';
  });
}

function cleanHtml(fragment = '') {
  return decodeHtml(String(fragment)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ''))
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseViews(value) {
  if (value === null || value === undefined) return 0;
  const normalized = String(value).trim().replace(/,/g, '').toUpperCase();
  const match = normalized.match(/^([0-9]+(?:\.[0-9]+)?)\s*([KMB])?$/);
  if (!match) return 0;
  const multipliers = { K: 1_000, M: 1_000_000, B: 1_000_000_000 };
  return Math.round(Number(match[1]) * (multipliers[match[2]] || 1));
}

function normalizeChannel(value) {
  const username = String(value || '').trim().replace(/^https?:\/\/t\.me\/(?:s\/)?/i, '').replace(/^@/, '').replace(/\/$/, '').toLowerCase();
  return /^[a-z][a-z0-9_]{3,31}$/.test(username) ? username : null;
}

function parseTelegramPreview(html, expectedChannel) {
  const source = String(html || '');
  const blocks = source.split(/(?=<div class="tgme_widget_message_wrap)/i).slice(1);
  const messages = [];

  for (const block of blocks) {
    const post = block.match(/data-post="([^"/]+)\/(\d+)"/i);
    if (!post) continue;
    const channel = normalizeChannel(post[1]);
    if (!channel || (expectedChannel && channel !== normalizeChannel(expectedChannel))) continue;
    const textMatch = block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/i);
    const dateMatch = block.match(/datetime="([^"]+)"/i);
    const viewsMatch = block.match(/tgme_widget_message_views[^>]*>([^<]*)</i);
    const messageId = Number(post[2]);
    messages.push({
      channel_username: channel,
      message_id: messageId,
      message_url: `https://t.me/${channel}/${messageId}`,
      text: textMatch ? cleanHtml(textMatch[1]) : '',
      published_at: dateMatch ? dateMatch[1] : null,
      views: parseViews(viewsMatch ? cleanHtml(viewsMatch[1]) : 0),
    });
  }

  return { ok: messages.length > 0, reason: messages.length ? null : 'NO_PUBLIC_WEB_PREVIEW_MESSAGES', messages };
}

module.exports = { cleanHtml, decodeHtml, normalizeChannel, parseTelegramPreview, parseViews };

