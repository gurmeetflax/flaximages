import { WebClient } from '@slack/web-api';
import { CHANNELS, USER_MAP } from './config';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export function outletName(userId) {
  return USER_MAP[userId] || userId;
}

export async function fetchChannelMessages(channelId, { oldest, limit = 100 } = {}) {
  const messages = [];
  let cursor;
  do {
    const res = await slack.conversations.history({
      channel: channelId,
      oldest: oldest || String(Math.floor(Date.now() / 1000) - 7 * 86400),
      limit: 200,
      cursor,
    });
    messages.push(...(res.messages || []));
    cursor = res.response_metadata?.next_cursor;
  } while (cursor && messages.length < limit);
  return messages;
}

export async function fetchWastageData(days = 7) {
  const channel = CHANNELS.find(c => c.id === 'wastage');
  if (!channel) return [];
  const oldest = String(Math.floor(Date.now() / 1000) - days * 86400);
  const messages = await fetchChannelMessages(channel.slackId, { oldest });
  return messages
    .filter(m => m.user && (m.text || m.files?.length))
    .map(m => ({
      outlet: outletName(m.user),
      text: m.text || '',
      hasImages: (m.files?.length || 0) > 0,
      imageCount: m.files?.length || 0,
      ts: m.ts,
      date: new Date(parseFloat(m.ts) * 1000).toISOString().split('T')[0],
      time: new Date(parseFloat(m.ts) * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }));
}

export async function fetchChecklistSubmissions(days = 7) {
  const channel = CHANNELS.find(c => c.id === 'outletchecklists');
  if (!channel) return {};
  const oldest = String(Math.floor(Date.now() / 1000) - days * 86400);
  const messages = await fetchChannelMessages(channel.slackId, { oldest });
  const submissions = {};
  for (const m of messages) {
    if (!m.user || !m.files?.length) continue;
    const outlet = outletName(m.user);
    const date = new Date(parseFloat(m.ts) * 1000).toISOString().split('T')[0];
    if (!submissions[outlet]) submissions[outlet] = [];
    submissions[outlet].push(date);
  }
  return submissions;
}

export async function fetchNAItems(days = 7) {
  const channel = CHANNELS.find(c => c.id === 'naitems');
  if (!channel) return [];
  const oldest = String(Math.floor(Date.now() / 1000) - days * 86400);
  const messages = await fetchChannelMessages(channel.slackId, { oldest });
  return messages
    .filter(m => m.user && m.text)
    .map(m => ({
      outlet: outletName(m.user),
      text: m.text,
      date: new Date(parseFloat(m.ts) * 1000).toISOString().split('T')[0],
      time: new Date(parseFloat(m.ts) * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }));
}
