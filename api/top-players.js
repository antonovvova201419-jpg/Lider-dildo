import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Разрешаем GET и POST (для CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Получаем топ-10 по убыванию кубков
  const top = await kv.zrevrange('leaderboard', 0, 999, { withScores: true });

  // Формируем ответ
  const result = [];
  for (let i = 0; i < top.length; i += 2) {
    const cleanNick = top[i];
    const cups = top[i + 1];
    const player = await kv.get(`player:${cleanNick}`);
    if (player) {
      result.push({
        rank: result.length + 1,
        nickname: player.nickname,
        cups: player.cups,
        games: player.games || 1
      });
    }
  }

  return res.status(200).json({ success: true, top: result });
}