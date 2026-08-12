'use strict';

const WORD_NUMBERS = Object.freeze({
  'یک': 1, 'دو': 2, 'سه': 3, 'چهار': 4, 'پنج': 5, 'شش': 6,
  'هفت': 7, 'هشت': 8, 'نه': 9, 'ده': 10, 'بیست': 20, 'سی': 30,
  'چهل': 40, 'پنجاه': 50, 'صد': 100,
});
const NUMBER_PATTERN = '(\\d{1,4}|یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده|بیست|سی|چهل|پنجاه|صد)';

function asciiDigits(value) {
  return String(value || '')
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

function numberValue(value) {
  const normalized = asciiDigits(value).trim();
  return WORD_NUMBERS[normalized] || Number(normalized) || null;
}

function parseQuery(question) {
  const normalizedQuestion = asciiDigits(String(question || '').replace(/مهن/g, 'مهم')).trim();
  const lastMatch = normalizedQuestion.match(new RegExp(`${NUMBER_PATTERN}\\s*پیام\\s*(?:اخیر|آخر)`));
  const timeMatch = normalizedQuestion.match(new RegExp(`${NUMBER_PATTERN}\\s*(ساعت|روز|هفته|ماه)\\s*(?:اخیر|گذشته)`));
  const channelMatch = normalizedQuestion.match(/@([a-z][a-z0-9_]{3,31})/i);
  const viewsMatch = normalizedQuestion.match(/(?:حداقل|بیش از|بالای|بالاتر از)\s*([0-9][0-9,._]*)\s*(?:بازدید|ویو)/i);
  const multipliers = { 'ساعت': 1, 'روز': 24, 'هفته': 168, 'ماه': 720 };
  const timeValue = timeMatch ? numberValue(timeMatch[1]) : null;
  return {
    question: normalizedQuestion,
    task: /(چند\s*تا|چند\s*پیام|تعداد)/.test(normalizedQuestion) ? 'count'
      : /(خلاصه|جمع[‌ -]?بندی)/.test(normalizedQuestion) ? 'summarize' : 'answer',
    last_n: lastMatch ? Math.min(100, numberValue(lastMatch[1])) : null,
    hours: timeValue ? Math.min(24 * 365, timeValue * multipliers[timeMatch[2]]) : (/امروز/.test(normalizedQuestion) ? 24 : null),
    channel: channelMatch ? channelMatch[1].toLowerCase() : null,
    min_views: viewsMatch ? Number(viewsMatch[1].replace(/[,._]/g, '')) : 0,
  };
}

function filterMessages(messages, plan, now = Date.now()) {
  const cutoff = plan.hours ? now - plan.hours * 3600000 : null;
  let rows = messages
    .filter((row) => row.message_id && row.message_url)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  if (cutoff) rows = rows.filter((row) => new Date(row.published_at).getTime() >= cutoff);
  if (plan.channel) rows = rows.filter((row) => String(row.channel_username).toLowerCase() === plan.channel);
  if (plan.min_views) rows = rows.filter((row) => Number(row.views || 0) >= plan.min_views);
  const filteredCount = rows.length;
  rows = rows.slice(0, plan.last_n || (plan.hours || plan.channel || plan.min_views ? 100 : 40));
  return { rows, filteredCount, truncated: filteredCount > rows.length };
}

module.exports = { asciiDigits, filterMessages, numberValue, parseQuery };
