const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Промисификация методов sqlite3 для удобного использования async/await
const query = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  exec(sql) {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

// Дефолтные аватарки и данные
const defaultBlankAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2364748b'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

const aliceAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150";
const bobAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150";
const adminAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

// Инициализация таблиц базы данных
async function initDatabase() {
  // Включаем поддержку внешних ключей
  await query.run("PRAGMA foreign_keys = ON");

  // Таблица пользователей
  await query.run(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      phone TEXT
    )
  `);

  // Таблица чатов
  await query.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      name TEXT,
      is_group INTEGER DEFAULT 0,
      avatar TEXT,
      bio TEXT,
      phone TEXT,
      owner TEXT
    )
  `);

  // Таблица участников чата (связь многие-ко-многим)
  await query.run(`
    CREATE TABLE IF NOT EXISTS chat_members (
      chat_id TEXT,
      username TEXT,
      PRIMARY KEY (chat_id, username),
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
    )
  `);

  // Таблица сообщений
  await query.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT,
      sender TEXT,
      text TEXT,
      type TEXT DEFAULT 'text',
      timestamp TEXT,
      created_at INTEGER,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )
  `);

  // Таблица истории звонков
  await query.run(`
    CREATE TABLE IF NOT EXISTS calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT,
      caller TEXT,
      type TEXT,
      incoming INTEGER DEFAULT 0,
      missed INTEGER DEFAULT 0,
      timestamp TEXT,
      created_at INTEGER,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )
  `);

  // Таблица статусов (историй)
  await query.run(`
    CREATE TABLE IF NOT EXISTS statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      media TEXT,
      text TEXT,
      timestamp TEXT,
      created_at INTEGER,
      FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
    )
  `);

  // Таблица настроек пользователей
  await query.run(`
    CREATE TABLE IF NOT EXISTS settings (
      username TEXT PRIMARY KEY,
      theme TEXT DEFAULT 'dark',
      lang TEXT DEFAULT 'ru',
      sound_effects INTEGER DEFAULT 1,
      enter_send INTEGER DEFAULT 1,
      typing_delay INTEGER DEFAULT 1,
      compact_mode INTEGER DEFAULT 0,
      privacy_last_seen TEXT DEFAULT 'everyone',
      disappearing_msgs TEXT DEFAULT 'off',
      chat_bg_color TEXT DEFAULT '#020617',
      my_bubble_color TEXT DEFAULT '#4f46e5',
      my_text_color TEXT DEFAULT '#ffffff',
      their_bubble_color TEXT DEFAULT '#1e293b',
      their_text_color TEXT DEFAULT '#f1f5f9',
      FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
    )
  `);

  // Добавляем встроенных ботов и админа, если их нет в базе
  await seedDefaultData();
}

async function seedDefaultData() {
  // Проверяем существование админа
  const admin = await query.get("SELECT * FROM users WHERE username = 'admin'");
  if (!admin) {
    await query.run(
      "INSERT INTO users (username, password, display_name, avatar, bio, phone) VALUES (?, ?, ?, ?, ?, ?)",
      ["admin", "admin", "Константин (Админ)", adminAvatar, "Разработчик GzafChat. Люблю экспериментировать с кодом и улучшать дизайн! ☕💻", "+7 (999) 777-77-77"]
    );
    await initDefaultSettings("admin");
  }

  // Проверяем существование ботов-контактов
  const alice = await query.get("SELECT * FROM users WHERE username = 'alice'");
  if (!alice) {
    await query.run(
      "INSERT INTO users (username, password, display_name, avatar, bio, phone) VALUES (?, ?, ?, ?, ?, ?)",
      ["alice", "bot_alice_pass", "Алиса Дизайнер", aliceAvatar, "Проектирую удобные интерфейсы. Люблю минимализм и темные оттенки. Всегда открыта к предложениям! 🎨✨", "+7 (921) 555-43-21"]
    );
    await initDefaultSettings("alice");
  }

  const bob = await query.get("SELECT * FROM users WHERE username = 'bob'");
  if (!bob) {
    await query.run(
      "INSERT INTO users (username, password, display_name, avatar, bio, phone) VALUES (?, ?, ?, ?, ?, ?)",
      ["bob", "bot_bob_pass", "Боб Разработчик", bobAvatar, "Фуллстек-разработчик. Автоматизирую всё, что движется. Люблю писать код под приятный лоу-фай 💻☕", "+7 (911) 444-12-34"]
    );
    await initDefaultSettings("bob");
  }
}

async function initDefaultSettings(username) {
  await query.run(
    "INSERT OR IGNORE INTO settings (username) VALUES (?)",
    [username]
  );
}

// Функции-хелперы для работы с БД

// ПОЛЬЗОВАТЕЛИ
async function registerUser(username, password, displayName, bio = "", phone = "") {
  username = username.toLowerCase().trim();
  const exists = await query.get("SELECT * FROM users WHERE username = ?", [username]);
  if (exists) throw new Error("usernameExistsError");

  await query.run(
    "INSERT INTO users (username, password, display_name, avatar, bio, phone) VALUES (?, ?, ?, ?, ?, ?)",
    [username, password, displayName, defaultBlankAvatar, bio || "Люблю кастомизацию in GzafChat!", phone]
  );

  await initDefaultSettings(username);

  // Автоматически создаем чаты с Алисой и Бобом для нового пользователя
  await setupDefaultBotChatsForUser(username);

  return { username, display_name: displayName, avatar: defaultBlankAvatar, bio, phone };
}

async function loginUser(username, password) {
  username = username.toLowerCase().trim();
  const user = await query.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
  if (!user) throw new Error("errorAuth");
  return user;
}

async function getUserProfile(username) {
  return await query.get("SELECT username, display_name, avatar, bio, phone FROM users WHERE username = ?", [username]);
}

async function updateUserProfile(username, displayName, bio, phone, avatar = null) {
  if (avatar) {
    await query.run(
      "UPDATE users SET display_name = ?, bio = ?, phone = ?, avatar = ? WHERE username = ?",
      [displayName, bio, phone, avatar, username]
    );
  } else {
    await query.run(
      "UPDATE users SET display_name = ?, bio = ?, phone = ? WHERE username = ?",
      [displayName, bio, phone, username]
    );
  }
  return await getUserProfile(username);
}

async function findUserByUsernameOrPhone(queryStr) {
  const q = `%${queryStr}%`;
  return await query.all(
    "SELECT username, display_name, avatar, bio, phone FROM users WHERE username LIKE ? OR display_name LIKE ? OR phone LIKE ?",
    [q, q, q]
  );
}

// НАСТРОЙКИ
async function getUserSettings(username) {
  return await query.get("SELECT * FROM settings WHERE username = ?", [username]);
}

async function saveUserSettings(username, s) {
  await query.run(`
    INSERT OR REPLACE INTO settings (
      username, theme, lang, sound_effects, enter_send, typing_delay, compact_mode,
      privacy_last_seen, disappearing_msgs, chat_bg_color, my_bubble_color, my_text_color,
      their_bubble_color, their_text_color
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    username, s.theme, s.lang, s.sound_effects ? 1 : 0, s.enter_send ? 1 : 0, s.typing_delay ? 1 : 0, s.compact_mode ? 1 : 0,
    s.privacy_last_seen, s.disappearing_msgs, s.chat_bg_color, s.my_bubble_color, s.my_text_color,
    s.their_bubble_color, s.their_text_color
  ]);
  return await getUserSettings(username);
}

// ЧАТЫ И СООБЩЕНИЯ
async function getChatsForUser(username) {
  // Получаем список чатов, в которых состоит пользователь
  const userChats = await query.all(`
    SELECT c.* FROM chats c
    JOIN chat_members cm ON c.id = cm.chat_id
    WHERE cm.username = ?
  `, [username]);

  const result = [];
  for (let chat of userChats) {
    let chatInfo = { ...chat };
    chatInfo.isGroup = chat.is_group === 1;

    // Если это приватный чат (1 на 1), имя и аватарка должны браться из профиля второго участника
    if (!chatInfo.isGroup) {
      const otherMember = await query.get(`
        SELECT u.username, u.display_name, u.avatar, u.bio, u.phone 
        FROM chat_members cm
        JOIN users u ON cm.username = u.username
        WHERE cm.chat_id = ? AND cm.username != ?
      `, [chat.id, username]);

      if (otherMember) {
        chatInfo.name = otherMember.display_name;
        chatInfo.avatar = otherMember.avatar;
        chatInfo.bio = otherMember.bio;
        chatInfo.phone = otherMember.phone;
        chatInfo.username = otherMember.username;
        // Проверяем онлайн статус (для простоты возвращаем статус в сети/недавно из профиля)
        chatInfo.status = otherMember.username === 'alice' || otherMember.username === 'bob' ? 'в сети' : 'был(а) недавно';
      }
    } else {
      chatInfo.status = 'групповой чат';
    }

    // Загружаем сообщения
    chatInfo.messages = await getMessages(chat.id);
    chatInfo.unread = 0; // На бэкенде можно считать непрочитанные, для простоты сбрасываем

    result.push(chatInfo);
  }

  return result;
}

async function createPrivateChat(userA, userB) {
  const chatId = `chat_${userA}_${userB}_${Date.now()}`;
  
  await query.run(
    "INSERT INTO chats (id, is_group) VALUES (?, 0)",
    [chatId]
  );

  await query.run(
    "INSERT INTO chat_members (chat_id, username) VALUES (?, ?), (?, ?)",
    [chatId, userA, chatId, userB]
  );

  return chatId;
}

async function createGroupChat(name, members, owner) {
  const chatId = `group_${Date.now()}`;
  const defaultGroupAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><path d='M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'/></svg>`;

  await query.run(
    "INSERT INTO chats (id, name, is_group, avatar, bio, phone, owner) VALUES (?, ?, 1, ?, ?, 'Групповой чат', ?)",
    [chatId, name, defaultGroupAvatar, `Групповой чат "${name}". Создан пользователем.`, owner]
  );

  // Добавляем создателя в группу
  await query.run(
    "INSERT INTO chat_members (chat_id, username) VALUES (?, ?)",
    [chatId, owner]
  );

  // Добавляем остальных участников
  for (let member of members) {
    await query.run(
      "INSERT OR IGNORE INTO chat_members (chat_id, username) VALUES (?, ?)",
      [chatId, member]
    );
  }

  // Добавляем системное сообщение о создании группы
  const timestamp = getCurrentTimeStr();
  await saveMessage(chatId, 'system', `Группа "${name}" успешно создана.`, 'text', timestamp);

  return chatId;
}

async function getMessages(chatId) {
  return await query.all(
    "SELECT m.id, m.chat_id, m.sender, m.text, m.type, m.timestamp, u.avatar as sender_avatar FROM messages m LEFT JOIN users u ON m.sender = u.username WHERE m.chat_id = ? ORDER BY m.created_at ASC",
    [chatId]
  );
}

async function saveMessage(chatId, sender, text, type = 'text', timestamp = null) {
  const ts = timestamp || getCurrentTimeStr();
  const res = await query.run(
    "INSERT INTO messages (chat_id, sender, text, type, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [chatId, sender, text, type, ts, Date.now()]
  );
  return { id: res.lastID, chat_id: chatId, sender, text, type, timestamp: ts };
}

// СТАТУСЫ (ИСТОРИИ)
async function getStatuses() {
  const rows = await query.all(`
    SELECT s.id, s.media, s.text, s.timestamp, s.created_at, u.display_name as name, u.avatar 
    FROM statuses s
    JOIN users u ON s.username = u.username
    WHERE s.created_at > ?
    ORDER BY s.created_at DESC
  `, [Date.now() - 24 * 60 * 60 * 1000]); // Только за последние 24 часа

  return rows;
}

async function saveStatus(username, media, text, timestamp) {
  await query.run(
    "INSERT INTO statuses (username, media, text, timestamp, created_at) VALUES (?, ?, ?, ?, ?)",
    [username, media, text, timestamp, Date.now()]
  );
}

// ЗВОНКИ
async function getCalls(username) {
  // Получаем звонки для чатов, в которых состоит пользователь
  return await query.all(`
    SELECT c.id, ch.name as chat_name, c.caller, c.type, c.incoming, c.missed, c.timestamp 
    FROM calls c
    JOIN chats ch ON c.chat_id = ch.id
    JOIN chat_members cm ON ch.id = cm.chat_id
    WHERE cm.username = ?
    ORDER BY c.created_at DESC
  `, [username]);
}

async function saveCall(chatId, caller, type, incoming, missed, timestamp) {
  await query.run(
    "INSERT INTO calls (chat_id, caller, type, incoming, missed, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [chatId, caller, type, incoming ? 1 : 0, missed ? 1 : 0, timestamp, Date.now()]
  );
}

async function clearCalls(username) {
  // Удаляем историю звонков из чатов пользователя
  await query.run(`
    DELETE FROM calls WHERE chat_id IN (
      SELECT chat_id FROM chat_members WHERE username = ?
    )
  `, [username]);
}

// Сидинг ботов для нового пользователя
async function setupDefaultBotChatsForUser(username) {
  // Чат с Алисой
  const chatAliceId = await createPrivateChat(username, 'alice');
  await saveMessage(chatAliceId, 'alice', "Привет! Как тебе новый макет мессенджера?", 'text', '14:20');
  await saveMessage(chatAliceId, username, "Выглядит потрясающе! Мне нравится цветовая гамма.", 'text', '14:22');
  await saveMessage(chatAliceId, 'alice', "Отлично, сегодня закончу остальные экраны и пришлю.", 'text', '14:23');

  // Чат с Бобом
  const chatBobId = await createPrivateChat(username, 'bob');
  await saveMessage(chatBobId, 'bob', "Привет, API для отправки файлов готово. Можешь проверять.", 'text', '11:05');
}

// Дополнительные хелперы
function getCurrentTimeStr() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

async function resetDatabase() {
  await query.exec("DROP TABLE IF EXISTS settings");
  await query.exec("DROP TABLE IF EXISTS statuses");
  await query.exec("DROP TABLE IF EXISTS calls");
  await query.exec("DROP TABLE IF EXISTS messages");
  await query.exec("DROP TABLE IF EXISTS chat_members");
  await query.exec("DROP TABLE IF EXISTS chats");
  await query.exec("DROP TABLE IF EXISTS users");
  await initDatabase();
}

module.exports = {
  initDatabase,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  findUserByUsernameOrPhone,
  getUserSettings,
  saveUserSettings,
  getChatsForUser,
  createPrivateChat,
  createGroupChat,
  getMessages,
  saveMessage,
  getStatuses,
  saveStatus,
  getCalls,
  saveCall,
  clearCalls,
  resetDatabase
};
