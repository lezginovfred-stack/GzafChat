const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Убедимся, что папка uploads существует
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Настройка Multer для сохранения медиафайлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB лимит
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Раздача статики
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// --- API ЭНДПОИНТЫ ---

// Инициализация БД при запуске
db.initDatabase()
  .then(() => console.log('SQLite database initialized successfully.'))
  .catch(err => console.error('Database initialization error:', err));

// 1. Авторизация
app.post('/api/auth/register', async (req, res) => {
  const { username, password, displayName, bio, phone } = req.body;
  try {
    const user = await db.registerUser(username, password, displayName, bio, phone);
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db.loginUser(username, password);
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/forgot', async (req, res) => {
  const { username, phone, newPassword } = req.body;
  try {
    // В SQLite обновляем пароль пользователя, если имя и телефон совпадают
    const user = await db.getUserProfile(username);
    if (!user || user.phone !== phone) {
      return res.status(400).json({ success: false, error: 'forgotErrorMsg' });
    }
    // Обновляем пароль в БД
    const databaseFile = path.join(__dirname, 'database.sqlite');
    const sqlite3 = require('sqlite3').verbose();
    const tempDb = new sqlite3.Database(databaseFile);
    tempDb.run("UPDATE users SET password = ? WHERE username = ?", [newPassword, username], (err) => {
      tempDb.close();
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Профиль пользователя
app.get('/api/profile/:username', async (req, res) => {
  try {
    const profile = await db.getUserProfile(req.params.username);
    if (!profile) return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/profile/:username', async (req, res) => {
  const { displayName, bio, phone, avatar } = req.body;
  try {
    const profile = await db.updateUserProfile(req.params.username, displayName, bio, phone, avatar);
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Загрузка аватарки через файл
app.post('/api/profile/:username/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Файл не загружен' });
    const avatarUrl = `/uploads/${req.file.filename}`;
    // Получаем текущие данные профиля
    const profile = await db.getUserProfile(req.params.username);
    const updated = await db.updateUserProfile(req.params.username, profile.display_name, profile.bio, profile.phone, avatarUrl);
    res.json({ success: true, profile: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Чаты
app.get('/api/chats/:username', async (req, res) => {
  try {
    const chats = await db.getChatsForUser(req.params.username);
    res.json({ success: true, chats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/chats/create-private', async (req, res) => {
  const { userA, userB } = req.body;
  try {
    const chatId = await db.createPrivateChat(userA, userB);
    res.json({ success: true, chatId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/chats/create-group', async (req, res) => {
  const { name, members, owner } = req.body;
  try {
    const chatId = await db.createGroupChat(name, members, owner);
    res.json({ success: true, chatId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/users/search', async (req, res) => {
  try {
    const users = await db.findUserByUsernameOrPhone(req.query.query || '');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Сообщения и медиа-сообщения
app.get('/api/messages/:chatId', async (req, res) => {
  try {
    const messages = await db.getMessages(req.params.chatId);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Загрузка медиа-сообщений (картинки, аудио-записи)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'Файл не загружен' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

// 5. Настройки
app.get('/api/settings/:username', async (req, res) => {
  try {
    const settings = await db.getUserSettings(req.params.username);
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings/:username', async (req, res) => {
  try {
    const settings = await db.saveUserSettings(req.params.username, req.body);
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Звонки
app.get('/api/calls/:username', async (req, res) => {
  try {
    const calls = await db.getCalls(req.params.username);
    res.json({ success: true, calls });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/calls/save', async (req, res) => {
  const { chatId, caller, type, incoming, missed, timestamp } = req.body;
  try {
    await db.saveCall(chatId, caller, type, incoming, missed, timestamp);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/calls/clear/:username', async (req, res) => {
  try {
    await db.clearCalls(req.params.username);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Статусы
app.get('/api/statuses', async (req, res) => {
  try {
    const statuses = await db.getStatuses();
    res.json({ success: true, statuses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/statuses', async (req, res) => {
  const { username, media, text, timestamp } = req.body;
  try {
    await db.saveStatus(username, media, text, timestamp);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Сброс
app.post('/api/reset', async (req, res) => {
  try {
    await db.resetDatabase();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// --- REALTIME SOCKET.IO LOGIC ---

// Хранилище активных подключений пользователей
const userSockets = new Map(); // username -> socketId

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Регистрация сокета под именем пользователя
  socket.on('register_session', async (username) => {
    if (!username) return;
    const lowerUsername = username.toLowerCase();
    userSockets.set(lowerUsername, socket.id);
    socket.username = lowerUsername;
    
    // Подключаем пользователя к комнатам всех его чатов
    try {
      const chats = await db.getChatsForUser(lowerUsername);
      chats.forEach(chat => {
        socket.join(chat.id);
      });
      // Личная комната пользователя для входящих звонков и приватных апдейтов
      socket.join(`user_${lowerUsername}`);
      console.log(`User registered: ${lowerUsername} -> socket: ${socket.id}, joined ${chats.length} chat rooms.`);
    } catch (e) {
      console.error("Error joining rooms for user:", lowerUsername, e);
    }
  });

  // Отправка сообщения в комнату чата
  socket.on('send_message', async (data) => {
    const { chatId, text, type, sender } = data;
    try {
      const timestamp = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const savedMsg = await db.saveMessage(chatId, sender, text, type, timestamp);
      
      // Рассылаем всем участникам комнаты чата
      io.to(chatId).emit('receive_message', savedMsg);

      // Проверяем, есть ли боты в чате
      // В SQLite приватный чат 1 на 1 имеет id, содержащий имена участников
      const chatDetails = await db.getChatsForUser(sender);
      const activeChat = chatDetails.find(c => c.id === chatId);

      if (activeChat && !activeChat.isGroup) {
        const botUsername = activeChat.username; // Это alice или bob
        if (botUsername === 'alice' || botUsername === 'bob') {
          // Имитируем автоответ бота
          triggerBotResponse(chatId, botUsername);
        }
      }
    } catch (err) {
      console.error("Socket: Error sending message:", err);
    }
  });

  // Логика автоответа встроенных ботов
  async function triggerBotResponse(chatId, botUsername) {
    // Получаем настройки создателя (для симуляции задержки печатания)
    // По умолчанию задержка 1.8-2.8 секунды
    const delay = 2500;
    
    // Отправляем статус "печатает..."
    setTimeout(() => {
      io.to(chatId).emit('typing_status', { chatId, username: botUsername, isTyping: true });
    }, 600);

    setTimeout(async () => {
      // Убираем статус печатания
      io.to(chatId).emit('typing_status', { chatId, username: botUsername, isTyping: false });

      // Генерируем случайную фразу бота
      const botReplies = botUsername === 'alice' 
        ? [
            "Давай сделаем кнопку отправки чуть ярче?",
            "Я отправлю тебе фигму через час.",
            "Как тебе идея добавить темную тему по умолчанию?",
            "Супер! Рада, что тебе нравится 👍"
          ]
        : [
            "Да, код уже в ветке main. Можешь стянуть.",
            "Я пофиксил баг с прокруткой сообщений на мобилках.",
            "Завтра начну настраивать базу данных.",
            "Давай созвонимся позже, обсудим API."
          ];
      const text = botReplies[Math.floor(Math.random() * botReplies.length)];
      const timestamp = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      
      const savedMsg = await db.saveMessage(chatId, botUsername, text, 'text', timestamp);
      io.to(chatId).emit('receive_message', savedMsg);
    }, delay);
  }

  // Трансляция индикатора ввода ("печатает...")
  socket.on('typing', (data) => {
    const { chatId, username, isTyping } = data;
    socket.to(chatId).emit('typing_status', { chatId, username, isTyping });
  });

  // Присоединение к новой комнате чата при создании его на клиенте
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} (${socket.username}) joined room ${chatId}`);
  });

  // --- ЛОГИКА СИГНАЛИЗАЦИИ ДЛЯ ЗВОНКОВ (WEBRTC-СИМУЛЯЦИЯ / РЕАЛЬНЫЙ ТАБ-ЧАТ) ---
  socket.on('call_user', (data) => {
    const { recipientUsername, callerUsername, chatId, type } = data;
    const lowerRecipient = recipientUsername.toLowerCase();
    console.log(`Call offer: from ${callerUsername} to ${lowerRecipient} in ${chatId} (${type})`);
    
    // Отправляем входящий звонок получателю в его личную комнату
    socket.to(`user_${lowerRecipient}`).emit('incoming_call', {
      callerUsername,
      chatId,
      type
    });
  });

  socket.on('accept_call', (data) => {
    const { callerUsername, recipientUsername, chatId } = data;
    const lowerCaller = callerUsername.toLowerCase();
    console.log(`Call accepted by ${recipientUsername} for caller ${lowerCaller}`);
    
    socket.to(`user_${lowerCaller}`).emit('call_accepted', {
      recipientUsername,
      chatId
    });
  });

  socket.on('reject_or_end_call', (data) => {
    const { recipientUsername, callerUsername, chatId } = data;
    const target = recipientUsername ? recipientUsername.toLowerCase() : (callerUsername ? callerUsername.toLowerCase() : null);
    
    if (target) {
      console.log(`Call rejected/ended. Notifying user_${target}`);
      socket.to(`user_${target}`).emit('call_ended', { chatId });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (socket.username) {
      userSockets.delete(socket.username);
    }
  });
});

// Слушаем сервер
server.listen(PORT, () => {
  console.log(`GzafChat2 server is running on http://localhost:${PORT}`);
});
