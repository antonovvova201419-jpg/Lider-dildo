import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nickname, cups } = req.body;

  if (!nickname || typeof cups !== 'number') {
    return res.status(400).json({ error: 'Неверные данные' });
  }

  const cleanNick = nickname.replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '').toLowerCase();

  // Получаем текущего игрока
  const player = await kv.get(`player:${cleanNick}`);
  
  if (!player) {
    return res.status(404).json({ error: 'Игрок не найден' });
  }

  // Обновляем данные
  player.cups += cups;
  player.games = (player.games || 0) + 1;
  player.lastPlayed = new Date().toISOString();

  // Сохраняем обратно
  await kv.set(`player:${cleanNick}`, player);

  // Обновляем позицию в лидерборде
  await kv.zadd('leaderboard', { score: player.cups, member: cleanNick, xx: true });

  return res.status(200).json({ 
    success: true, 
    newTotal: player.cups,
    message: 'Кубки обновлены'
  });
}