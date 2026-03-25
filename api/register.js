import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nickname, cups } = req.body;

  if (!nickname || nickname.length < 3) {
    return res.status(400).json({ error: 'Некорректный ник' });
  }

  const cleanNick = nickname.replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '').toLowerCase();

  // Проверяем, не занят ли ник
  const exists = await kv.get(`player:${cleanNick}`);
  if (exists) {
    return res.status(409).json({ error: 'Ник уже зарегистрирован' });
  }

  // Создаем запись игрока
  const playerData = {
    nickname: nickname, // сохраняем оригинальный регистр для отображения
    cups: cups || 0,
    games: 1,
    registeredAt: new Date().toISOString()
  };

  // Сохраняем в KV
  await kv.set(`player:${cleanNick}`, playerData);

  // Добавляем в сортируемый список для топа
  await kv.zadd('leaderboard', { score: playerData.cups, member: cleanNick });

  return res.status(201).json({ 
    success: true, 
    message: 'Регистрация успешна',
    player: playerData 
  });
}