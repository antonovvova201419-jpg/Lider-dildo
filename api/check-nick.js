import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Разрешаем только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nickname } = req.body;

  if (!nickname || nickname.length < 3) {
    return res.status(400).json({ error: 'Ник должен быть от 3 символов' });
  }

  // Очищаем ник от спецсимволов (безопасность)
  const cleanNick = nickname.replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '').toLowerCase();

  // Проверяем, есть ли такой ник в базе
  const exists = await kv.get(`player:${cleanNick}`);

  if (exists) {
    return res.status(409).json({ available: false, message: 'Ник уже занят' });
  }

  return res.status(200).json({ available: true, message: 'Ник свободен' });
}