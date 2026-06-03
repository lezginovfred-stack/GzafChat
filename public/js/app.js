// Состояние клиента
let currentUser = null;
let userProfile = null;
let chats = [];
let activeChatId = null;
let currentLang = 'ru';
let currentTheme = 'dark';
let socket = null;

// Настройки приложения
let soundEffectsEnabled = true;
let enterSendEnabled = true;
let typingDelayEnabled = true;
let compactModeEnabled = false;
let lastSeenPrivacy = 'everyone';
let disappearingMsgs = 'off';

// Логика записи голоса
let isRecording = false;
let recordSeconds = 0;
let recordInterval = null;

// Логика звонков
let callTimer = null;
let callSecondsElapsed = 0;
let isCallActive = false;
let isMuted = false;
let isSpeaker = false;
let activeCallData = null; // Данные текущего звонка (chatId, type, caller, recipient)

// Стримы звонков
let localStream = null;
let isCameraOn = true;

// Web Audio API
let ringInterval = null;
let callAudioCtx = null;
let callOsc1 = null;
let callOsc2 = null;
let callGain = null;

// Список телефонных контактов
let mockPhoneContacts = [];

// Категории смайликов
const emojiCategories = {
    "Смайлики": [
        "😊","😂","😍","🥰","😘","😜","😎","🤔","🙄","😴","😡","😭","😱","🥳","🤩","😏",
        "😅","🤤","🤮","🤯","🤠","😇","🤫","🤡","🤖","👾","👽","💀","👻","💩","😈","👀",
        "🤣","😃","😄","😁","😆","😉","😋","😛","😝","🤪","🤨","🧐","🤓","🥸","😏","😒",
        "😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😤","😠","🤬","😳",
        "🥵","🥶","😱","😨","😰","😥","😓","🤗","🫣","🤭","🤥","😶","😐","😑","😬","🫨",
        "🫠","🙄","😯","😦","😧","😮","😲","🥱","😴","💤","💩","🤡","👽","👾","🤖","🎃",
        "😺","😸","😹","😻","😼","😽","🙀","😿","😾"
    ],
    "Жесты / Люди": [
        "👍","👎","👌","✌️","👋","👏","🙏","🙌","💪","👊","✊","🤝","🖕","✍️","💅","🧠",
        "🖖","🤘","🤙","🤞","🤟","🫵","👉","👈","👆","👇","☝️","✋","🖐️","🤚","🦾","🦿",
        "🦵","🦶","👂","🦻","👃","🫀","🫁","🦷","👁️","👀","👤","👥","🫂","✍️","🤳"
    ],
    "Природа / Животные": [
        "🐱","🐶","🦊","🦁","🐼","🐸","🐵","🦄","🌹","🌸","🌲","🌵","🌍","☀️","🌙","🔥",
        "🐕","🐈","🐆","🐴","🦓","🦌","🦬","🐮","🐷","🐏","🐑","🐐","🐪","🐫","🦙","🦒",
        "🐘","🦣","🦏","🦛","🐭","🐰","🐿️","🦫","🦔","🦇","🐻","🐨","🦥","🦦","🦨","🦘",
        "🦡","🦅","🦆","🦢","🦉","🦤","🦩","🦚","🦜","🐊","🐢","🦎","🐍","🐲","🐙","🦑",
        "🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧"
    ],
    "Еда / Напитки": [
        "🍕","🍔","🍟","🍣","🍦","🍰","☕","🍺","🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇",
        "🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","👑","👑","🍅","🍆","🥑","🥦","🥬","🥒","🌶️",
        "🫑","🌽","🥕","🧄","🧅","🥔","🍠","🥐","🍞","🥖","🫓","🥨","🥯","🥞","🧇",
        "🧀","🍖","🍗","🥩","🥓","🌭","🥪","🌮","🌯","🫔","🥙","🧆","🍳","🥘","🍲"
    ],
    "Сердца / Символы": [
        "❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","💖","✨","🌟","💯","🎉","🚀","💻",
        "📱","🎮","🎵","💵","🎁","🎈","🔑","🎯","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💘",
        "💝","💟","💌","💥","💫","💦","💨","🕳️","💬","💭","💤","🌐","🌀","🌈","⚡","❄️",
        "🔥","💧","🌊","🎈","🎉","🎊","🎁","🎗️","🎟️","🎫","🏆","🏅","🥇","🥈","🥉"
    ]
};

// Заглушка аватара
const defaultBlankAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2364748b'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

// Словарь локализации (Русский, Азербайджанский, Английский)
const translations = {
    ru: {
        appName: "GzafChat",
        authTitle: "Вход в GzafChat",
        authSubtitle: "Введите ваши данные для доступа к переписке",
        loginBtn: "Войти в аккаунт",
        noAccount: "Нет аккаунта?",
        registerLink: "Зарегистрироваться",
        usernameLabel: "Имя пользователя (Никнейм)",
        passwordLabel: "Пароль",
        regTitle: "Регистрация",
        regSubtitle: "Создайте новую учетную запись в системе",
        regUsernameLabel: "Имя пользователя (Уникальный ник)",
        regDisplayNameLabel: "Отображаемое имя",
        regPasswordLabel: "Пароль",
        regPhoneLabel: "Номер телефона",
        regBioLabel: "О себе",
        createAccountBtn: "Создать аккаунт",
        alreadyHaveAccount: "Уже есть аккаунт?",
        loginLink: "Войти",
        welcomeTitle: "Добро пожаловать в GzafChat",
        welcomeDesc: "Выберите чат. Кликните по аватарке собеседника или своей, чтобы открыть информацию о профиле.",
        settingsTitle: "Настройки дизайна и профиля",
        profileSection: "Мой Профиль",
        displayNameLabel: "Отображаемое имя",
        bioLabel: "О себе (Статус)",
        phoneLabel: "Номер телефона",
        designSection: "Кастомизация дизайна чата",
        chatBgLabel: "Фон переписки (Задний план)",
        myBubbleLabel: "Мои сообщения (Справа)",
        theirBubbleLabel: "Чужие сообщения (Слева)",
        bubbleColorLabel: "Пузырь",
        textColorLabel: "Текст",
        systemSection: "Системные настройки",
        logoutBtn: "Выйти из аккаунта",
        resetBtn: "Сбросить базу",
        cancelBtn: "Отмена",
        saveBtn: "Сохранить",
        createGroupTitle: "Создать группу",
        groupNameLabel: "Название группы",
        chooseMembersLabel: "Выберите участников",
        createGroupBtn: "Создать",
        groupCreatedMsg: "Группа создана",
        successAlertTitle: "Успешно!",
        alertOkBtn: "Отлично",
        regSuccessTitle: "Успешная регистрация!",
        regSuccessMsg: "Ваш профиль в GzafChat успешно создан. Теперь вы можете войти в систему и установить фотографию в вашей карточке профиля.",
        cameraDisabledMsg: "Камера не найдена. Активирована интерактивная симуляция потока.",
        encryptedLabel: "Зашифровано",
        videoCallStateCalling: "Вызов...",
        videoCallStateConnecting: "Инициализация терминала...",
        videoCallStateActive: "В эфире (Защищенное соединение)",
        videoCallRemoteCalling: "Ожидание ответа удаленного терминала...",
        onlineStatus: "в сети",
        offlineStatus: "был(а) недавно",
        groupChatStatus: "групповой чат",
        customBgColor: "Цвет",
        searchPlaceholder: "Поиск контактов...",
        messageInputPlaceholder: "Напишите сообщение...",
        systemGroupCreated: 'Группа "{groupName}" успешно создана.',
        logoutConfirm: "Вы действительно хотите выйти из своего аккаунта?",
        resetConfirm: "Вы действительно хотите полностью очистить ВСЕ данные мессенджера (включая всех пользователей и настройки)?",
        enterGroupName: "Пожалуйста, введите название группы.",
        selectOneMember: "Выберите хотя бы одного участника группы.",
        noContacts: "Нет доступных участников",
        errorAuth: "Неверное имя пользователя или пароль.",
        usernameLengthError: "Имя пользователя должно быть не менее 3 символов, пароль — не менее 4 символов.",
        usernameExistsError: "Пользователь с таким никнеймом уже зарегистрирован!",
        themeLabel: "Тема оформления",
        themeDark: "Тёмная",
        themeLight: "Светлая",
        langLabel: "Язык интерфейса",
        phoneContactsTitle: "Контакты на телефоне",
        inviteBtn: "Пригласить",
        invitationSentTitle: "Приглашение отправлено",
        invitationSentMsg: "Ссылка-приглашение в GzafChat успешно отправлена на номер {phone}.",
        phoneContactsTooltip: "Посмотреть контакты телефона",
        addManualContact: "Добавить вручную",

        tabChatsTooltip: "Чаты",
        tabStatusesTooltip: "Статусы",
        tabCallsTooltip: "Звонки",
        statusTabTitle: "Мой статус",
        addStatusBtn: "Добавить",
        myStatusLabel: "Мой статус",
        noStatusYet: "Нажмите, чтобы добавить или просмотреть",
        recentStatuses: "Недавние обновления",
        callTabTitle: "Журнал звонков",
        clearCallsBtn: "Очистить",
        recentCalls: "Последние звонки",
        noCalls: "Звонков пока не было",
        extraSettingsTitle: "Дополнительные настройки",
        privacyLabel: "Конфиденциальность",
        soundSection: "Звук и уведомления",
        soundEffectsLabel: "Звуковые эффекты",
        soundEffectsDesc: "Проигрывать при отправке и получении",
        behaviorLabel: "Поведение чата",
        enterSendLabel: "Отправка клавишей Enter",
        enterSendDesc: "Отправлять сообщения без зажатия Shift",
        compactModeLabel: "Компактный вид",
        compactModeDesc: "Уменьшить отступы пузырей переписки",
        typingDelayLabel: "Симуляция печатания",
        typingDelayDesc: "Эмулировать 'Печатает...' перед ответом бота",
        disappearingMsgsLabel: "Исчезающие сообщения",
        disappearingOff: "Выключены",
        disappearing24h: "24 часа",
        disappearing7d: "7 дней",
        disappearing90d: "90 дней",
        privacyLastSeenLabel: "Показывать статус 'был в сети'",
        privacyLastSeenEveryone: "Всем",
        privacyLastSeenContacts: "Моим контактам",
        privacyLastSeenNobody: "Никому",
        statusAddedAlert: "Ваш статус успешно обновлен!",
        callIncoming: "Входящий",
        callOutgoing: "Исходящий",
        callMissed: "Пропущенный",
        callHistoryCleared: "Журнал звонков очищен.",

        nameAdmin: "Константин (Админ)",
        nameAlice: "Алиса Дизайнер",
        nameBob: "Боб Разработчик",
        bioAdmin: "Разработчик GzafChat. Люблю экспериментировать с кодом и улучшать дизайн! ☕💻",
        bioAlice: "Проектирую удобные интерфейсы. Люблю минимализм и темные оттенки. Всегда открыта к предложениям! 🎨✨",
        bioBob: "Фуллстек-разработчик. Автоматизирую всё, что движется. Люблю писать код под приятный лоу-фай 💻☕",

        forgotPasswordLink: "Забыли пароль?",
        forgotTitle: "Восстановление пароля",
        forgotSubtitle: "Введите имя, зарегистрированный телефон и новый пароль для сброса",
        forgotBtn: "Сбросить и установить новый пароль",
        forgotUsernameLabel: "Имя пользователя",
        forgotPhoneLabel: "Номер телефона",
        forgotNewPasswordLabel: "Новый пароль",
        backToLoginLink: "Вернуться ко входу",
        forgotSuccessTitle: "Пароль успешно сброшен!",
        forgotSuccessMsg: "Ваш пароль был успешно обновлен. Теперь вы можете войти.",
        forgotErrorMsg: "Пользователь с таким именем и номером телефона не найден в системе.",

        globalSearchHeader: "Глобальный поиск",
        startChatBadge: "Начать чат"
    },
    az: {
        appName: "GzafChat",
        authTitle: "GzafChat-a Giriş",
        authSubtitle: "Məlumatlarınızı daxil edin",
        loginBtn: "Daxil ol",
        noAccount: "Hesabınız yoxdur?",
        registerLink: "Qeydiyyatdan keçin",
        usernameLabel: "İstifadəçi adı (Nik)",
        passwordLabel: "Şifrə",
        regTitle: "Qeydiyyat",
        regSubtitle: "Sistemdə yeni hesab yaradın",
        regUsernameLabel: "İstifadəçi adı",
        regDisplayNameLabel: "Görünən ad",
        regPasswordLabel: "Şifrə",
        regPhoneLabel: "Telefon nömrəsi",
        regBioLabel: "Haqqımda",
        createAccountBtn: "Hesab yarat",
        alreadyHaveAccount: "Hesabınız var?",
        loginLink: "Daxil ol",
        welcomeTitle: "GzafChat-a xoş gəlmisiniz",
        welcomeDesc: "Söhbət seçin.",
        settingsTitle: "Dizayn və profil ayarları",
        profileSection: "Mənim Profilim",
        displayNameLabel: "Görünən ad",
        bioLabel: "Haqqımda",
        phoneLabel: "Telefon nömrəsi",
        designSection: "Söhbət dizaynı",
        chatBgLabel: "Yazışma fonu",
        myBubbleLabel: "Mənim mesajlarım",
        theirBubbleLabel: "Başqasının mesajları",
        bubbleColorLabel: "Balon",
        textColorLabel: "Mətn",
        systemSection: "Sistem Ayarları",
        logoutBtn: "Hesabdan çıx",
        resetBtn: "Baza sıfırla",
        cancelBtn: "Ləğv et",
        saveBtn: "Yadda saxla",
        createGroupTitle: "Qrup yarat",
        groupNameLabel: "Qrup adı",
        chooseMembersLabel: "İştirakçıları seçin",
        createGroupBtn: "Yarat",
        groupCreatedMsg: "Qrup yaradıldı",
        successAlertTitle: "Uğurlu!",
        alertOkBtn: "Əla",
        regSuccessTitle: "Qeydiyyat tamamlandı!",
        regSuccessMsg: "Profiliniz uğurla yaradıldı.",
        cameraDisabledMsg: "Kamera tapılmadı.",
        encryptedLabel: "Şifrələnmiş",
        videoCallStateCalling: "Zəng edilir...",
        videoCallStateConnecting: "Qoşulur...",
        videoCallStateActive: "Efirda",
        videoCallRemoteCalling: "Cavab gözlənilir...",
        onlineStatus: "onlayn",
        offlineStatus: "bu yaxınlarda olub",
        groupChatStatus: "qrup söhbəti",
        customBgColor: "Rəng",
        searchPlaceholder: "Axtar...",
        messageInputPlaceholder: "Mesaj yazın...",
        systemGroupCreated: '"{groupName}" qrupu yaradıldı.',
        logoutConfirm: "Çıxmaq istədiyinizə əminsiniz?",
        resetConfirm: "Sıfırlamaq istədiyinizə əminsiniz?",
        enterGroupName: "Qrup adını daxil edin.",
        selectOneMember: "Ən azı bir iştirakçı seçin.",
        noContacts: "Əlçatan iştirakçı yoxdur",
        errorAuth: "İstifadəçi adı və ya şifrə yanlışdır.",
        usernameLengthError: "İstifadəçi adı ən azı 3, şifrə ən azı 4 simvol olmalıdır.",
        usernameExistsError: "Bu nik istifadə olunur!",
        themeLabel: "Dizayn mövzusu",
        themeDark: "Qaranlıq",
        themeLight: "Açıq",
        langLabel: "İnterfeys dili",
        phoneContactsTitle: "Telefondakı kontaktlar",
        inviteBtn: "Dəvət et",
        invitationSentTitle: "Dəvətnamə göndərildi",
        invitationSentMsg: "GzafChat-a dəvət linki {phone} nömrəsinə göndərildi.",
        phoneContactsTooltip: "Telefon kontaktlarına baxın",
        addManualContact: "Əl ilə əlavə et",

        tabChatsTooltip: "Söhbətlər",
        tabStatusesTooltip: "Statuslar",
        tabCallsTooltip: "Zənglər",
        statusTabTitle: "Mənim statusum",
        addStatusBtn: "Əlavə et",
        myStatusLabel: "Mənim statusum",
        noStatusYet: "Əlavə etmək üçün klikləyin",
        recentStatuses: "Son yeniləmələr",
        callTabTitle: "Zəng tarixçəsi",
        clearCallsBtn: "Təmizlə",
        recentCalls: "Son zənglər",
        noCalls: "Zəng tarixçəsi boşdur",
        extraSettingsTitle: "Əlavə parametrlər",
        privacyLabel: "Məxfilik",
        soundSection: "Səs və Bildirişlər",
        soundEffectsLabel: "Səs effektləri",
        soundEffectsDesc: "Mesaj göndəriləndə və alınanda səs çıxsın",
        behaviorLabel: "Söhbət davranışı",
        enterSendLabel: "Enter düyməsi ilə göndər",
        enterSendDesc: "Shift olmadan mesajları göndər",
        compactModeLabel: "Yığcam rejim",
        compactModeDesc: "Mesajların kənar boşluqlarını azaldın",
        typingDelayLabel: "Yazma simulyasiyası",
        typingDelayDesc: "Botun cavabından əvvəl 'Yazır...' görsənsin",
        disappearingMsgsLabel: "İtən mesajlar",
        disappearingOff: "Söndürülüb",
        disappearing24h: "24 saat",
        disappearing7d: "7 gün",
        disappearing90d: "90 gün",
        privacyLastSeenLabel: "Son görünmə statusu",
        privacyLastSeenEveryone: "Hər kəsə",
        privacyLastSeenContacts: "Kontaktlarıma",
        privacyLastSeenNobody: "Heç kimə",
        statusAddedAlert: "Statusunuz uğurla əlavə edildi!",
        callIncoming: "Gələn",
        callOutgoing: "Gedən",
        callMissed: "Buraxılmış",
        callHistoryCleared: "Zəng tarixçəsi təmizləndi.",

        nameAdmin: "Konстантин (Admin)",
        nameAlice: "Alis Dizayner",
        nameBob: "Bob Tərtibatçı",
        bioAdmin: "GzafChat tərtibatçısı. Kodla təcrübə aparmağı və dizaynı təkmilləşdirməyi sevirəm! ☕💻",
        bioAlice: "Rahat interfeyslər hazırlayıram. Minimalizmi və tünd çalarları sevirəm. Hər zaman təkliflərə açığam! 🎨✨",
        bioBob: "Fullstack proqramçı. Hərəkət edən hər şeyi avtomatlaşdırıram. Layt lofi musiqisi altında kod yazmağı sevirəm 💻☕",

        forgotPasswordLink: "Şifrəni unutmusunuz?",
        forgotTitle: "Şifrənin bərpası",
        forgotSubtitle: "Şifrəni sıfırlamaq üçün istifadəçi adını, qeydiyyatlı telefonu və yeni şifrəni daxil edin",
        forgotBtn: "Sıfırla və yeni şifrə təyin et",
        forgotUsernameLabel: "İstifadəçi adı (Nik)",
        forgotPhoneLabel: "Telefon nömrəsi",
        forgotNewPasswordLabel: "Yeni şifrə",
        backToLoginLink: "Girişə qayıt",
        forgotSuccessTitle: "Şifrə dəyişdirildi!",
        forgotSuccessMsg: "Şifrəniz uğurla dəyişdirildi. İndi daxil ola bilərsiniz.",
        forgotErrorMsg: "Bu istifadəçi adı və telefon nömrəsinə uyğun sistemdə istifadəçi tapılmadı.",

        globalSearchHeader: "Qlobal axtarış",
        startChatBadge: "Söhbətə başla"
    },
    en: {
        appName: "GzafChat",
        authTitle: "Sign in to GzafChat",
        authSubtitle: "Enter your credentials to access chats",
        loginBtn: "Log In",
        noAccount: "Don't have an account?",
        registerLink: "Register",
        usernameLabel: "Username",
        passwordLabel: "Password",
        regTitle: "Registration",
        regSubtitle: "Create a new account in the system",
        regUsernameLabel: "Username",
        regDisplayNameLabel: "Display Name",
        regPasswordLabel: "Password",
        regPhoneLabel: "Phone Number",
        regBioLabel: "About Me",
        createAccountBtn: "Create Account",
        alreadyHaveAccount: "Already have an account?",
        loginLink: "Log In",
        welcomeTitle: "Welcome to GzafChat",
        welcomeDesc: "Choose a chat. Click on the contact avatar or your own to view profile card details.",
        settingsTitle: "Design & Profile Settings",
        profileSection: "My Profile",
        displayNameLabel: "Display Name",
        bioLabel: "About Me",
        phoneLabel: "Phone Number",
        designSection: "Customize Chat Design",
        chatBgLabel: "Chat Background",
        myBubbleLabel: "My Messages",
        theirBubbleLabel: "Their Messages",
        bubbleColorLabel: "Bubble",
        textColorLabel: "Text",
        systemSection: "System Settings",
        logoutBtn: "Log Out",
        resetBtn: "Reset DB",
        cancelBtn: "Cancel",
        saveBtn: "Save",
        createGroupTitle: "Create Group",
        groupNameLabel: "Group Name",
        chooseMembersLabel: "Select Members",
        createGroupBtn: "Create",
        groupCreatedMsg: "Group Created",
        successAlertTitle: "Success!",
        alertOkBtn: "Excellent",
        regSuccessTitle: "Registration Successful!",
        regSuccessMsg: "Your profile has been created.",
        cameraDisabledMsg: "Camera not found.",
        encryptedLabel: "Encrypted",
        videoCallStateCalling: "Calling...",
        videoCallStateConnecting: "Connecting...",
        videoCallStateActive: "On Air",
        videoCallRemoteCalling: "Waiting for reply...",
        onlineStatus: "online",
        offlineStatus: "recently seen",
        groupChatStatus: "group chat",
        customBgColor: "Color",
        searchPlaceholder: "Search contacts...",
        messageInputPlaceholder: "Type a message...",
        systemGroupCreated: 'Group "{groupName}" created.',
        logoutConfirm: "Are you sure you want to log out?",
        resetConfirm: "Are you sure you want to reset everything?",
        enterGroupName: "Enter a group name.",
        selectOneMember: "Select at least one member.",
        noContacts: "No members available",
        errorAuth: "Incorrect credentials.",
        usernameLengthError: "Username min 3, Password min 4 chars.",
        usernameExistsError: "Username already taken!",
        themeLabel: "Theme",
        themeDark: "Dark",
        themeLight: "Light",
        langLabel: "Language",
        phoneContactsTitle: "Phone Contacts",
        inviteBtn: "Invite",
        invitationSentTitle: "Invitation Sent",
        invitationSentMsg: "Invitation link successfully sent to {phone}.",
        phoneContactsTooltip: "View phone contacts",
        addManualContact: "Add manually",

        tabChatsTooltip: "Chats",
        tabStatusesTooltip: "Statuses",
        tabCallsTooltip: "Calls",
        statusTabTitle: "My Status",
        addStatusBtn: "Add",
        myStatusLabel: "My Status",
        noStatusYet: "Click to add or view status",
        recentStatuses: "Recent Updates",
        callTabTitle: "Call History",
        clearCallsBtn: "Clear",
        recentCalls: "Recent Calls",
        noCalls: "No call logs yet",
        extraSettingsTitle: "Additional Settings",
        privacyLabel: "Privacy",
        soundSection: "Sound & Notifications",
        soundEffectsLabel: "Sound Effects",
        soundEffectsDesc: "Play sound on sending and receiving",
        behaviorLabel: "Chat Behavior",
        enterSendLabel: "Enter to Send",
        enterSendDesc: "Send messages without holding Shift",
        compactModeLabel: "Compact UI Mode",
        compactModeDesc: "Reduce paddings of message bubbles",
        typingDelayLabel: "Typing Simulation",
        typingDelayDesc: "Simulate 'Typing...' before bot replies",
        disappearingMsgsLabel: "Disappearing Messages",
        disappearingOff: "Off",
        disappearing24h: "24 Hours",
        disappearing7d: "7 Days",
        disappearing90d: "90 Days",
        privacyLastSeenLabel: "Show 'last seen' status",
        privacyLastSeenEveryone: "Everyone",
        privacyLastSeenContacts: "My Contacts",
        privacyLastSeenNobody: "Nobody",
        statusAddedAlert: "Status successfully updated!",
        callIncoming: "Incoming",
        callOutgoing: "Outgoing",
        callMissed: "Missed",
        callHistoryCleared: "Call history cleared.",

        nameAdmin: "Constantine (Admin)",
        nameAlice: "Alice Designer",
        nameBob: "Bob Developer",
        bioAdmin: "GzafChat Developer. Love experimenting with code and improving design! ☕💻",
        bioAlice: "Designing comfortable interfaces. I love minimalism and dark shades. Always open to suggestions! 🎨✨",
        bioBob: "Full-stack developer. Automating everything that moves. Love coding with lo-fi music 💻☕",

        forgotPasswordLink: "Forgot Password?",
        forgotTitle: "Password Recovery",
        forgotSubtitle: "Enter username, registered phone and new password to reset",
        forgotBtn: "Reset and Set New Password",
        forgotUsernameLabel: "Username",
        forgotPhoneLabel: "Phone Number",
        forgotNewPasswordLabel: "New Password",
        backToLoginLink: "Back to Login",
        forgotSuccessTitle: "Password Reset Successful!",
        forgotSuccessMsg: "Your password has been successfully updated. You can now log in.",
        forgotErrorMsg: "User with this username and phone number was not found in the system.",

        globalSearchHeader: "Global Search",
        startChatBadge: "Start Chat"
    }
};

// Хелпер получения локализованных имен
function getLocalizedName(chat) {
    const dict = translations[currentLang];
    if (chat.id === 1 || chat.name === "Алиса Дизайнер" || chat.name === "Alis Dizayner" || chat.name === "Alice Designer") {
        return dict.nameAlice;
    }
    if (chat.id === 2 || chat.name === "Боб Разработчик" || chat.name === "Bob Tərtibatçı" || chat.name === "Bob Developer") {
        return dict.nameBob;
    }
    if (chat.username === "admin" || chat.name === "Константин (Админ)" || chat.name === "Konstantin (Admin)" || chat.name === "Constantine (Admin)") {
        return dict.nameAdmin;
    }
    return chat.name;
}

// Инициализация при загрузке страницы
function init() {
    try {
        currentUser = JSON.parse(localStorage.getItem('gzafchat_current_user')) || null;
    } catch(e) {
        currentUser = null;
    }
    checkAuth();
}

// Проверка сессии авторизации
async function checkAuth() {
    if (currentUser) {
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('appMainContainer').classList.remove('hidden');
        
        // Подключаем WebSocket
        initSocket();

        // Загружаем профиль, настройки, звонки и чаты с бэкенда
        await loadUserProfile();
        await loadSettings();
        await loadChats();
        
        applyLanguage();
        applyAppTheme();
        initEmojiPanel();
        initEnterSendListener();
        
        try {
            lucide.createIcons();
        } catch (e) {}
    } else {
        document.getElementById('authContainer').classList.remove('hidden');
        document.getElementById('appMainContainer').classList.add('hidden');
        switchAuthMode('login');
    }
}

// Инициализация Socket.io клиента (Безопасная версия)
function initSocket() {
    if (socket) return;
    
    // Если клиент Socket.io не загрузился (например, ошибка 404 на сервере), 
    // предотвращаем падение всего приложения и пишем предупреждение в консоль
    if (typeof io === 'undefined') {
        console.warn("Socket.io client is not loaded (io is undefined). Running in simulated offline mode.");
        return;
    }
    
    try {
        socket = io();

        // Регистрируем сессию на сервере
        socket.emit('register_session', currentUser.username);

        // Слушаем входящие сообщения
        socket.on('receive_message', (msg) => {
            const chat = chats.find(c => c.id === msg.chat_id);
            if (chat) {
                if (!chat.messages.some(m => m.id === msg.id)) {
                    chat.messages.push(msg);
                    
                    if (msg.sender !== currentUser.username) {
                        playReceivedSound();
                        if (activeChatId !== chat.id) {
                            chat.unread++;
                        }
                    }
                    
                    if (activeChatId === chat.id) {
                        renderMessages();
                    }
                    renderChats();
                }
            }
        });

        // Слушаем индикаторы ввода
        socket.on('typing_status', (data) => {
            const { chatId, username, isTyping } = data;
            if (activeChatId === chatId && username !== currentUser.username) {
                const statusTextEl = document.getElementById('chatStatus');
                if (statusTextEl) {
                    if (isTyping) {
                        statusTextEl.innerText = currentLang === 'ru' ? 'печатает...' : (currentLang === 'az' ? 'yazır...' : 'typing...');
                        statusTextEl.classList.add('text-indigo-400', 'font-semibold');
                    } else {
                        const chat = chats.find(c => c.id === chatId);
                        if (chat) {
                            const dict = translations[currentLang];
                            let localizedStatus = chat.status;
                            if (chat.status === "в сети") localizedStatus = dict.onlineStatus;
                            else if (chat.status === "был(а) недавно") localizedStatus = dict.offlineStatus;
                            statusTextEl.innerText = localizedStatus;
                        }
                        statusTextEl.classList.remove('text-indigo-400', 'font-semibold');
                    }
                }
            }
        });

        // Слушаем входящие звонки
        socket.on('incoming_call', (data) => {
            const { callerUsername, chatId, type } = data;
            showIncomingCallOverlay(callerUsername, chatId, type);
        });

        // Слушаем принятие звонка
        socket.on('call_accepted', (data) => {
            const { recipientUsername, chatId } = data;
            stopRingingSound();
            playAnswerSound();
            
            const dict = translations[currentLang];
            const stateId = activeCallData.type === 'video' ? 'videoCallState' : 'callState';
            const stateEl = document.getElementById(stateId);
            
            if (activeCallData.type === 'video') {
                document.getElementById('videoCallRemoteCalling').classList.add('hidden');
                document.getElementById('videoCallRemotePlaceholder').classList.remove('hidden');
                stateEl.innerText = dict.videoCallStateActive;
            } else {
                stateEl.innerText = "00:00";
                callSecondsElapsed = 0;
                callTimer = setInterval(() => {
                    callSecondsElapsed++;
                    const mins = Math.floor(callSecondsElapsed / 60);
                    const secs = callSecondsElapsed % 60;
                    stateEl.innerText = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
                }, 1000);
            }
        });

        // Слушаем отмену или сброс звонка
        socket.on('call_ended', () => {
            handleCallTermination(false);
        });
        
    } catch (e) {
        console.error("Failed to connect or initialize Socket.io:", e);
    }
}

// Загрузка профиля с сервера
async function loadUserProfile() {
    try {
        const res = await fetch(`/api/profile/${currentUser.username}`);
        const data = await res.json();
        if (data.success) {
            userProfile = data.profile;
            applyProfile();
        }
    } catch (e) {
        console.error("Error loading profile:", e);
    }
}

// Применение настроек профиля к UI
function applyProfile() {
    if (!userProfile) return;
    document.getElementById('myProfileName').innerText = userProfile.display_name;
    document.getElementById('myProfileAvatar').src = userProfile.avatar || defaultBlankAvatar;
    document.getElementById('myStatusAvatar').src = userProfile.avatar || defaultBlankAvatar;
    document.getElementById('settingsProfilePic').src = userProfile.avatar || defaultBlankAvatar;

    const container = document.getElementById('messagesContainer');
    if (container) {
        container.style.backgroundColor = userProfile.chatBgColor || '#020617';
    }
}

// Загрузка настроек с сервера
async function loadSettings() {
    try {
        const res = await fetch(`/api/settings/${currentUser.username}`);
        const data = await res.json();
        if (data.success && data.settings) {
            const s = data.settings;
            currentLang = s.lang || 'ru';
            currentTheme = s.theme || 'dark';
            soundEffectsEnabled = s.sound_effects === 1;
            enterSendEnabled = s.enter_send === 1;
            typingDelayEnabled = s.typing_delay === 1;
            compactModeEnabled = s.compact_mode === 1;
            lastSeenPrivacy = s.privacy_last_seen || 'everyone';
            disappearingMsgs = s.disappearing_msgs || 'off';
            
            // Записываем HEX-цвета в профиль
            userProfile.chatBgColor = s.chat_bg_color || '#020617';
            userProfile.myBubbleColor = s.my_bubble_color || '#4f46e5';
            userProfile.myTextColor = s.my_text_color || '#ffffff';
            userProfile.theirBubbleColor = s.their_bubble_color || '#1e293b';
            userProfile.theirTextColor = s.their_text_color || '#f1f5f9';
        }
    } catch(e) {
        console.error("Error loading settings:", e);
    }
}

// Загрузка чатов с сервера
async function loadChats() {
    try {
        const res = await fetch(`/api/chats/${currentUser.username}`);
        const data = await res.json();
        if (data.success) {
            chats = data.chats;
            renderChats();
        }
    } catch (e) {
        console.error("Error loading chats:", e);
    }
}

// Отрисовка списка чатов
function renderChats(searchQuery = "") {
    const container = document.getElementById('chatsContainer');
    if (!container) return;
    container.innerHTML = '';
    const dict = translations[currentLang];
    const query = searchQuery.toLowerCase().trim();

    // Сортировка по времени последнего сообщения
    const sortedChats = [...chats].sort((a, b) => {
        const timeA = a.messages.length > 0 ? a.messages[a.messages.length - 1].timestamp : "";
        const timeB = b.messages.length > 0 ? b.messages[b.messages.length - 1].timestamp : "";
        return timeB.localeCompare(timeA);
    });

    sortedChats.forEach(chat => {
        const localizedName = getLocalizedName(chat);
        const phone = chat.phone ? chat.phone.toLowerCase() : "";
        const username = chat.username ? chat.username.toLowerCase() : "";

        if (query) {
            const matchesName = localizedName.toLowerCase().includes(query);
            const matchesPhone = phone.includes(query);
            const matchesUsername = username.includes(query);
            if (!matchesName && !matchesPhone && !matchesUsername) return;
        }

        const lastMsg = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
        let msgText = "";
        if (lastMsg) {
            if (lastMsg.type === 'image') msgText = "📷 " + (currentLang === 'ru' ? "Фотография" : (currentLang === 'az' ? "Şəkil" : "Photo"));
            else if (lastMsg.type === 'voice') msgText = "🎵 " + (currentLang === 'ru' ? "Голосовое сообщение" : (currentLang === 'az' ? "Səsli mesaj" : "Voice message"));
            else msgText = lastMsg.text;
        }

        const time = lastMsg ? lastMsg.timestamp : "";
        const isActive = chat.id === activeChatId;

        let isOnlineElement = '';
        if (chat.status === 'в сети' && !chat.isGroup) {
            isOnlineElement = `<span class="w-2.5 h-2.5 rounded-full border-2 border-slate-900 status-online-dot absolute bottom-0 right-0 z-10"></span>`;
        } else if (chat.status === 'был(а) недавно' && !chat.isGroup) {
            isOnlineElement = `<span class="w-2.5 h-2.5 rounded-full border-2 border-slate-900 status-offline-dot absolute bottom-0 right-0 z-10"></span>`;
        }

        const row = document.createElement('div');
        row.className = `p-3.5 flex items-center space-x-3 cursor-pointer transition relative hover:bg-slate-800/40 select-none ${isActive ? 'bg-indigo-600/15 border-l-4 border-indigo-500 hover:bg-indigo-600/20' : ''}`;
        row.onclick = () => selectChat(chat.id);

        row.innerHTML = `
            <div class="relative flex-shrink-0" onclick="openProfileInfo(event, 'contact', '${chat.id}')">
                <img src="${chat.avatar || defaultBlankAvatar}" class="w-11 h-11 rounded-full object-cover shadow-md hover:opacity-85 transition" alt="${localizedName}">
                ${isOnlineElement}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-baseline mb-0.5">
                    <h3 class="font-bold text-slate-200 text-xs truncate max-w-[170px]">${localizedName}</h3>
                    <span class="text-[10px] text-slate-500 font-mono flex-shrink-0">${time}</span>
                </div>
                <div class="flex justify-between items-center">
                    <p class="text-xs text-slate-400 truncate pr-2">${msgText}</p>
                    ${chat.unread > 0 ? `<span class="bg-indigo-600 text-white font-bold text-[10px] h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center animate-pulse flex-shrink-0">${chat.unread}</span>` : ''}
                </div>
            </div>
        `;
        container.appendChild(row);
    });

    // Поиск по глобальным пользователям (если есть поисковый запрос)
    if (query) {
        performGlobalSearch(query, container, dict);
    }
}

// Глобальный поиск на сервере
async function performGlobalSearch(query, container, dict) {
    try {
        const res = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success && data.users.length > 0) {
            const nonActiveUsers = data.users.filter(u => {
                if (u.username === currentUser.username) return false;
                // Исключаем тех, у кого уже есть чат
                return !chats.some(c => c.username === u.username);
            });

            if (nonActiveUsers.length > 0) {
                const header = document.createElement('div');
                header.className = 'p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-950/40 border-t border-b border-slate-800/40 mt-2';
                header.innerText = dict.globalSearchHeader;
                container.appendChild(header);

                nonActiveUsers.forEach(u => {
                    const row = document.createElement('div');
                    row.className = `p-3.5 flex items-center space-x-3 cursor-pointer transition hover:bg-slate-800/40 select-none`;
                    row.onclick = () => startPrivateChatWithRegisteredUser(u.username);

                    row.innerHTML = `
                        <div class="relative flex-shrink-0">
                            <img src="${u.avatar || defaultBlankAvatar}" class="w-11 h-11 rounded-full object-cover shadow-md" alt="${u.display_name}">
                            <span class="w-2.5 h-2.5 rounded-full border-2 border-slate-900 status-offline-dot absolute bottom-0 right-0 z-10"></span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-baseline mb-0.5">
                                <h3 class="font-bold text-slate-200 text-xs truncate max-w-[170px]">${u.display_name}</h3>
                                <span class="text-[9px] text-indigo-400 font-semibold uppercase tracking-wider">${dict.startChatBadge}</span>
                            </div>
                            <p class="text-[10px] text-slate-400 truncate font-mono">@${u.username} ${u.phone ? '• ' + u.phone : ''}</p>
                        </div>
                    `;
                    container.appendChild(row);
                });
            }
        }
    } catch (e) {
        console.error("Global search error:", e);
    }
}

// Создание диалога при выборе из глобального поиска
async function startPrivateChatWithRegisteredUser(username) {
    try {
        const response = await fetch('/api/chats/create-private', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userA: currentUser.username, userB: username })
        });
        const data = await response.json();
        if (data.success) {
            // Оповещаем сокет о подключении к новой комнате чата
            socket.emit('join_chat', data.chatId);
            
            // Перегружаем чаты и открываем
            await loadChats();
            selectChat(data.chatId);
            
            document.getElementById('searchInput').value = '';
            renderChats();
        }
    } catch(e) {
        console.error("Error creating chat:", e);
    }
}

// Выбор активного диалога
function selectChat(id) {
    activeChatId = id;
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    chat.unread = 0;

    document.getElementById('noChatSelected').classList.add('hidden');
    document.getElementById('activeChat').classList.remove('hidden');

    const sidebar = document.getElementById('sidebar');
    const chatArea = document.getElementById('chatArea');
    sidebar.classList.add('hidden');
    sidebar.classList.remove('w-full');
    sidebar.classList.add('md:block');
    chatArea.classList.remove('hidden');
    chatArea.classList.add('flex');

    const dict = translations[currentLang];
    let localizedStatus = chat.status;
    if (chat.status === "в сети") localizedStatus = dict.onlineStatus;
    else if (chat.status === "был(а) недавно") localizedStatus = dict.offlineStatus;
    else if (chat.status === "групповой чат") localizedStatus = dict.groupChatStatus;

    document.getElementById('chatName').innerText = getLocalizedName(chat);
    document.getElementById('chatAvatar').src = chat.avatar || defaultBlankAvatar;
    document.getElementById('chatStatus').innerText = localizedStatus;

    // Применяем кастомные цвета чата (если заданы)
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.style.backgroundColor = userProfile.chatBgColor || '#020617';

    renderChats();
    renderMessages();
    closeEmojiPanel();
}

function backToSidebar() {
    const sidebar = document.getElementById('sidebar');
    const chatArea = document.getElementById('chatArea');
    sidebar.classList.remove('hidden');
    sidebar.classList.add('w-full');
    chatArea.classList.add('hidden');
    chatArea.classList.remove('flex');
    activeChatId = null;
}

// Отрисовка сообщений
function renderMessages() {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    container.innerHTML = '';

    const chat = chats.find(c => c.id === activeChatId);
    if (!chat) return;

    // Исчезающие сообщения
    let maxAge = 0;
    if (disappearingMsgs === '24h') maxAge = 24 * 60 * 60 * 1000;
    else if (disappearingMsgs === '7d') maxAge = 7 * 24 * 60 * 60 * 1000;
    else if (disappearingMsgs === '90d') maxAge = 90 * 24 * 60 * 60 * 1000;

    let filteredMessages = chat.messages;
    if (maxAge > 0) {
        filteredMessages = chat.messages.filter(msg => (Date.now() - msg.id) < maxAge);
    }

    filteredMessages.forEach(msg => {
        const isMe = msg.sender === currentUser.username;
        const isSystem = msg.sender === 'system';
        const wrapper = document.createElement('div');
        wrapper.className = isSystem ? "flex justify-center my-2" : `flex ${isMe ? 'justify-end' : 'justify-start'} items-end space-x-2 message-new-anim`;

        if (isSystem) {
            wrapper.innerHTML = `
                <div class="bg-slate-900/60 border border-slate-800 text-slate-400 text-[10px] py-1 px-3 rounded-full font-medium shadow-sm uppercase tracking-wider text-center max-w-xs">
                    ${msg.text}
                </div>
            `;
        } else {
            let contentHtml = "";
            if (msg.type === 'image') {
                contentHtml = `<img src="${msg.text}" class="rounded-xl max-w-xs max-h-60 object-cover shadow-inner cursor-pointer hover:opacity-95 transition" onclick="window.open('${msg.text}', '_blank')">`;
            } else if (msg.type === 'voice') {
                contentHtml = `
                    <div class="flex items-center space-x-3 py-1 px-2 min-w-[200px]">
                        <button type="button" onclick="playVoiceMessageSimulation(this)" class="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white flex items-center justify-center transition btn-anim flex-shrink-0">
                            <i data-lucide="play" class="w-4 h-4 ml-0.5"></i>
                        </button>
                        <div class="flex-1">
                            <div class="h-1 bg-slate-700 rounded-full overflow-hidden relative">
                                <div class="w-0 h-full bg-indigo-500 transition-all duration-300"></div>
                            </div>
                            <span class="text-[10px] text-slate-400 mt-1 block font-mono">${msg.text}</span>
                        </div>
                    </div>
                `;
            } else {
                contentHtml = `<p class="whitespace-pre-wrap leading-relaxed text-xs break-words">${msg.text}</p>`;
            }

            const bubbleStyles = isMe 
                ? `background-color: ${userProfile.myBubbleColor || '#4f46e5'}; color: ${userProfile.myTextColor || '#ffffff'}; border-bottom-right-radius: 4px;`
                : `background-color: ${userProfile.theirBubbleColor || '#1e293b'}; color: ${userProfile.theirTextColor || '#f1f5f9'}; border-bottom-left-radius: 4px;`;

            // В групповых чатах делаем аватар кликабельным для начала личного чата
            const avatarHtml = !isMe ? 
                (chat.isGroup ? 
                    `<img src="${msg.sender_avatar || defaultBlankAvatar}" class="w-7 h-7 rounded-full object-cover mb-1 border border-slate-800 shadow-sm flex-shrink-0 cursor-pointer hover:opacity-80 transition" onclick="startPrivateChatWithRegisteredUser('${msg.sender}')" title="${translations[currentLang].startChatBadge || 'Написать в личку'}">` :
                    `<img src="${chat.avatar || defaultBlankAvatar}" class="w-7 h-7 rounded-full object-cover mb-1 border border-slate-800 shadow-sm flex-shrink-0">`
                ) : '';

            wrapper.innerHTML = `
                ${avatarHtml}
                <div style="${bubbleStyles}" class="max-w-xs md:max-w-md rounded-2xl py-2 px-3.5 shadow-md relative group">
                    ${contentHtml}
                    <div class="flex justify-end items-center space-x-1 mt-1 text-[9px] opacity-60 font-mono">
                        <span>${msg.timestamp}</span>
                        ${isMe ? `<i data-lucide="check-check" class="w-3 h-3 text-emerald-400"></i>` : ''}
                    </div>
                </div>
            `;
        }

        container.appendChild(wrapper);
    });

    container.scrollTop = container.scrollHeight;
    try {
        lucide.createIcons();
    } catch (e) {}
}

// Отправка сообщений
function handleSend(e) {
    e.preventDefault();
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text) return;

    sendMessage(text, 'text');
    input.value = '';
    closeEmojiPanel();
}

function sendMessage(content, type = 'text') {
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat) return;

    const msgData = {
        chatId: activeChatId,
        text: content,
        type: type,
        sender: currentUser.username
    };

    // Отправляем по WebSocket
    socket.emit('send_message', msgData);
    playSentSound();
}

// Индикатор печати
function initEnterSendListener() {
    const input = document.getElementById('messageInput');
    if (!input) return;
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            if (enterSendEnabled) {
                e.preventDefault();
                const submitBtn = document.querySelector('#messageForm button[type="submit"]');
                if (submitBtn) submitBtn.click();
            }
        } else {
            // Отсылаем сигнал о вводе текста
            if (socket) {
                socket.emit('typing', { chatId: activeChatId, username: currentUser.username, isTyping: true });
                
                // Убираем индикатор через 2 секунды неактивности
                clearTimeout(window.typingTimeout);
                window.typingTimeout = setTimeout(() => {
                    socket.emit('typing', { chatId: activeChatId, username: currentUser.username, isTyping: false });
                }, 2000);
            }
        }
    });
}

// Загрузка картинок через multer
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            sendMessage(data.url, 'image');
        }
    } catch(e) {
        console.error("Error uploading image:", e);
    }
    event.target.value = '';
}

// Запись голосовых
function toggleVoiceRecord() {
    if (!isRecording) {
        isRecording = true;
        recordSeconds = 0;
        document.getElementById('micIcon').classList.add('text-red-500', 'animate-pulse');
        document.getElementById('micBtn').classList.add('bg-red-500/10');
        const timerEl = document.getElementById('recordTimer');
        timerEl.classList.remove('hidden');
        timerEl.innerText = "0:00";

        playMicBeep();

        recordInterval = setInterval(() => {
            recordSeconds++;
            const mins = Math.floor(recordSeconds / 60);
            const secs = recordSeconds % 60;
            timerEl.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }, 1000);
    } else {
        isRecording = false;
        clearInterval(recordInterval);
        document.getElementById('micIcon').classList.remove('text-red-500', 'animate-pulse');
        document.getElementById('micBtn').classList.remove('bg-red-500/10');
        document.getElementById('recordTimer').classList.add('hidden');

        const finalDuration = document.getElementById('recordTimer').innerText;
        sendMessage(`Голосовое сообщение (${finalDuration})`, 'voice');
    }
}

function playMicBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch(e){}
}

function playVoiceMessageSimulation(btn) {
    const icon = btn.querySelector('i');
    const fillBar = btn.nextElementSibling.querySelector('.w-0');
    
    if (icon.getAttribute('data-lucide') === 'play') {
        icon.setAttribute('data-lucide', 'square');
        if (fillBar) {
            fillBar.style.width = '100%';
            fillBar.style.transition = 'width 6s linear';
        }
        
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 3);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 5.8);
            osc.start();
            osc.stop(ctx.currentTime + 5.9);
        } catch(e){}

        setTimeout(() => {
            icon.setAttribute('data-lucide', 'play');
            if (fillBar) {
                fillBar.style.transition = 'none';
                fillBar.style.width = '0%';
            }
            try { lucide.createIcons(); } catch(e){}
        }, 6000);
    } else {
        icon.setAttribute('data-lucide', 'play');
        if (fillBar) {
            fillBar.style.transition = 'none';
            fillBar.style.width = '0%';
        }
    }
    try { lucide.createIcons(); } catch(e){}
}

// --- ЛОГИКА ТАБОВ (ЧАТЫ, СТАТУСЫ, ЗВОНКИ) ---
function switchTab(tabName) {
    const tabs = ['chats', 'statuses', 'calls'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tabBtn-${t}`);
        const content = document.getElementById(`tabContent-${t}`);
        if (t === tabName) {
            btn.classList.add('text-indigo-500', 'border-indigo-500');
            btn.classList.remove('text-slate-400', 'border-transparent');
            content.classList.remove('hidden');
        } else {
            btn.classList.remove('text-indigo-500', 'border-indigo-500');
            btn.classList.add('text-slate-400', 'border-transparent');
            content.classList.add('hidden');
        }
    });

    if (tabName === 'statuses') {
        loadStatuses();
    } else if (tabName === 'calls') {
        loadCalls();
    }
    try { lucide.createIcons(); } catch(e) {}
}

// --- СТАТУСЫ ---
let myStatus = null;

async function loadStatuses() {
    try {
        const res = await fetch('/api/statuses');
        const data = await res.json();
        if (data.success) {
            renderStatuses(data.statuses);
        }
    } catch(e) {
        console.error("Error loading statuses:", e);
    }
}

function renderStatuses(serverStatuses) {
    const myStatusTimeEl = document.getElementById('myStatusTime');
    const myStatusAvatarEl = document.getElementById('myStatusAvatar');
    const container = document.getElementById('recentStatusesContainer');
    const dict = translations[currentLang];

    const myStatusPreviewText = document.getElementById('myStatusPreviewText');
    const myStatusPreviewImgContainer = document.getElementById('myStatusPreviewImgContainer');
    const myStatusPreviewImg = document.getElementById('myStatusPreviewImg');

    if (userProfile) {
        myStatusAvatarEl.src = userProfile.avatar || defaultBlankAvatar;
    }

    // Ищем собственный статус
    myStatus = serverStatuses.find(s => s.name === userProfile.display_name) || null;

    if (myStatus) {
        myStatusTimeEl.innerText = `${dict.myStatusLabel} • ${myStatus.timestamp}`;
        if (myStatus.text) {
            myStatusPreviewText.innerText = myStatus.text;
            myStatusPreviewText.classList.remove('hidden');
        } else {
            myStatusPreviewText.classList.add('hidden');
        }
        if (myStatus.media) {
            myStatusPreviewImg.src = myStatus.media;
            myStatusPreviewImgContainer.classList.remove('hidden');
        } else {
            myStatusPreviewImgContainer.classList.add('hidden');
        }
    } else {
        myStatusTimeEl.innerText = dict.noStatusYet;
        myStatusPreviewText.classList.add('hidden');
        myStatusPreviewImgContainer.classList.add('hidden');
    }

    if (!container) return;
    container.innerHTML = '';

    // Другие статусы
    const otherStatuses = serverStatuses.filter(s => s.name !== userProfile.display_name);

    if (otherStatuses.length === 0) {
        // Загружаем пару статических если пусто для красоты
        const staticList = [
            { name: dict.nameAlice, avatar: aliceAvatar, media: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500", text: "Работаю над новым интерфейсом GzafChat v2! 🎨✨", timestamp: "15 минут назад" },
            { name: dict.nameBob, avatar: bobAvatar, media: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500", text: "Пофиксил все баги, можно пить кофе ☕💻", timestamp: "2 часа назад" }
        ];
        staticList.forEach(st => {
            appendStatusRow(container, st.name, st.avatar, st.media, st.text, st.timestamp);
        });
    } else {
        otherStatuses.forEach(st => {
            appendStatusRow(container, st.name, st.avatar, st.media, st.text, st.timestamp);
        });
    }
}

const aliceAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150";
const bobAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150";

function appendStatusRow(container, name, avatar, media, text, time) {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-900/40 transition';
    row.onclick = () => viewStatus(name, avatar, media, text, time);
    row.innerHTML = `
        <div class="flex items-center space-x-3 overflow-hidden flex-1">
            <div class="relative flex-shrink-0">
                <img src="${avatar || defaultBlankAvatar}" class="w-11 h-11 rounded-full object-cover border-2 border-indigo-500 p-0.5 bg-slate-900">
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-xs text-slate-200 truncate">${name}</h4>
                <p class="text-[10px] text-slate-400 truncate">${time}</p>
                ${text ? `<p class="text-[11px] text-slate-400 italic truncate mt-0.5">${text}</p>` : ''}
            </div>
        </div>
        ${media ? `
            <div class="w-10 h-10 ml-2 rounded-lg overflow-hidden border border-slate-800/80 flex-shrink-0">
                <img src="${media}" class="w-full h-full object-cover filter brightness-75 hover:brightness-100 transition">
            </div>
        ` : ''}
    `;
    container.appendChild(row);
}

// Добавление новой истории
async function handleAddStatus(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        // Загружаем картинку на сервер
        const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const uploadData = await uploadRes.json();
        
        if (uploadData.success) {
            const statusText = prompt(currentLang === 'ru' ? "Введите описание для вашей истории (необязательно):" : (currentLang === 'az' ? "Hekayəniz üçün qısa təsvir yazın (isteğe bağlı):" : "Enter status caption (optional):")) || "";
            
            const timestamp = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const statusData = {
                username: currentUser.username,
                media: uploadData.url,
                text: statusText,
                timestamp: timestamp
            };

            const response = await fetch('/api/statuses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(statusData)
            });
            const data = await response.json();
            if (data.success) {
                await loadStatuses();
                showCustomAlert("successAlertTitle", "statusAddedAlert");
            }
        }
    } catch(e) {
        console.error("Error creating status:", e);
    }
    event.target.value = '';
}

function viewMyStatus() {
    if (myStatus) {
        viewStatus(userProfile.display_name, userProfile.avatar, myStatus.media, myStatus.text, myStatus.timestamp);
    } else {
        document.getElementById('statusFileInput').click();
    }
}

let statusProgressInterval = null;
function viewStatus(name, avatar, media, text, time) {
    const overlay = document.getElementById('statusViewerOverlay');
    document.getElementById('statusViewerAvatar').src = avatar || defaultBlankAvatar;
    document.getElementById('statusViewerName').innerText = name;
    document.getElementById('statusViewerTime').innerText = time;
    document.getElementById('statusViewerImage').src = media;
    document.getElementById('statusViewerText').innerText = text || "";

    overlay.classList.remove('hidden');

    const progressBar = document.getElementById('statusProgressBar');
    progressBar.style.width = '0%';

    let progress = 0;
    clearInterval(statusProgressInterval);
    statusProgressInterval = setInterval(() => {
        progress += 2;
        progressBar.style.width = `${progress}%`;
        if (progress >= 100) {
            closeStatusViewer();
        }
    }, 100);
}

function closeStatusViewer() {
    clearInterval(statusProgressInterval);
    document.getElementById('statusViewerOverlay').classList.add('hidden');
}

// --- ЖУРНАЛ ЗВОНКОВ ---
async function loadCalls() {
    try {
        const res = await fetch(`/api/calls/${currentUser.username}`);
        const data = await res.json();
        if (data.success) {
            renderCallHistory(data.calls);
        }
    } catch(e) {
        console.error("Error loading calls:", e);
    }
}

function renderCallHistory(callsList = []) {
    const container = document.getElementById('callHistoryContainer');
    if (!container) return;
    container.innerHTML = '';
    const dict = translations[currentLang];

    if (callsList.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 text-center py-6">${dict.noCalls}</p>`;
        return;
    }

    callsList.forEach(log => {
        let callIcon = log.type === 'video' ? 'video' : 'phone';
        let arrowIcon = 'arrow-down-left';
        let colorClass = 'text-emerald-400';
        let statusText = dict.callIncoming;

        if (log.missed === 1) {
            colorClass = 'text-red-500';
            statusText = dict.callMissed;
        } else if (log.incoming === 0) {
            arrowIcon = 'arrow-up-right';
            colorClass = 'text-slate-400';
            statusText = dict.callOutgoing;
        }

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl hover:border-indigo-500/30 transition duration-150';
        row.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                    <i data-lucide="${callIcon}" class="w-4.5 h-4.5"></i>
                </div>
                <div>
                    <h4 class="font-bold text-slate-200 text-xs">${log.chat_name}</h4>
                    <div class="flex items-center space-x-1 mt-0.5">
                        <i data-lucide="${arrowIcon}" class="w-3.5 h-3.5 ${colorClass}"></i>
                        <span class="text-[10px] text-slate-500">${log.timestamp} • ${statusText}</span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(row);
    });
    try { lucide.createIcons(); } catch(e) {}
}

async function clearCallHistory() {
    try {
        const response = await fetch(`/api/calls/clear/${currentUser.username}`, {
            method: 'POST'
        });
        const data = await response.json();
        if (data.success) {
            await loadCalls();
            showCustomAlert("successAlertTitle", "callHistoryCleared");
        }
    } catch(e) {
        console.error("Error clearing calls:", e);
    }
}

// --- ЛОГИКА АКТИВНЫХ ЗВОНКОВ (SOCKET.IO + СИГНАЛИЗАЦИЯ) ---

// Начать аудиозвонок
async function startAudioCall() {
    initiateOutgoingCall('audio');
}

// Начать видеозвонок
async function startVideoCall() {
    initiateOutgoingCall('video');
}

function initiateOutgoingCall(type) {
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat || chat.isGroup) return; // Симулируем вызовы только 1 на 1

    const recipientUsername = chat.username;
    
    activeCallData = {
        chatId: activeChatId,
        type: type,
        caller: currentUser.username,
        recipient: recipientUsername
    };

    // Записываем исходящий вызов в лог на сервер
    const timestamp = `${getCurrentDateString()}, ${getCurrentTime()}`;
    fetch('/api/calls/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chatId: activeChatId,
            caller: currentUser.username,
            type: type,
            incoming: false,
            missed: false,
            timestamp
        })
    });

    // Отсылаем сигнал звонка получателю
    socket.emit('call_user', {
        recipientUsername,
        callerUsername: currentUser.username,
        chatId: activeChatId,
        type
    });

    isCallActive = true;
    showCallUI(chat.name, chat.avatar, type, 'outgoing');
    startRingingSound();

    // Таймаут если никто не взял трубку (через 30 секунд)
    window.callTimeoutTimer = setTimeout(() => {
        if (isCallActive) {
            handleCallTermination(true);
        }
    }, 30000);
}

// Показ экрана звонка
function showCallUI(name, avatar, type, direction) {
    const isVideo = type === 'video';
    const overlayId = isVideo ? 'videoCallOverlay' : 'callOverlay';
    const overlay = document.getElementById(overlayId);

    document.getElementById(isVideo ? 'videoCallContactName' : 'callContactName').innerText = name;
    document.getElementById(isVideo ? 'videoCallRemoteAvatar' : 'callContactAvatar').src = avatar || defaultBlankAvatar;

    const dict = translations[currentLang];
    const stateEl = document.getElementById(isVideo ? 'videoCallState' : 'callState');
    stateEl.innerText = dict.videoCallStateConnecting;

    if (isVideo) {
        document.getElementById('videoCallRemotePlaceholder').classList.add('hidden');
        document.getElementById('videoCallRemoteCalling').classList.remove('hidden');
        document.getElementById('localVideo').classList.add('hidden');
        document.getElementById('localVideoSimulated').classList.add('hidden');
        document.getElementById('localVideoPlaceholder').classList.add('hidden');
    } else {
        document.getElementById('callPulseRing').classList.add('animate-ping');
    }

    // Изменение кнопок при входящем звонке
    setupCallButtons(overlayId, direction);

    overlay.classList.remove('hidden');
    try { lucide.createIcons(); } catch (e) {}
}

function setupCallButtons(overlayId, direction) {
    const isVideo = overlayId === 'videoCallOverlay';
    const container = isVideo 
        ? document.querySelector('#videoCallOverlay .absolute.bottom-6')
        : document.getElementById('callButtonsContainer');

    if (!container) return;

    if (direction === 'incoming') {
        // Показываем кнопки "Принять" и "Отклонить"
        container.innerHTML = `
            <button onclick="acceptIncomingCall()" class="w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center transition btn-anim shadow-xl">
                <i data-lucide="phone" class="w-6 h-6"></i>
            </button>
            <button onclick="declineIncomingCall()" class="w-14 h-14 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition btn-anim shadow-xl">
                <i data-lucide="phone-off" class="w-6 h-6"></i>
            </button>
        `;
    } else {
        // Стандартные кнопки
        if (isVideo) {
            container.innerHTML = `
                <button id="videoCallMuteBtn" onclick="toggleCallMute()" class="w-12 h-12 bg-slate-900/80 hover:bg-slate-800 text-white border border-white/5 rounded-full flex items-center justify-center transition btn-anim shadow-lg">
                    <i data-lucide="mic-off" class="w-5 h-5"></i>
                </button>
                <button onclick="endVideoCall()" class="w-14 h-14 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition btn-anim shadow-xl transform hover:rotate-90">
                    <i data-lucide="phone-off" class="w-5 h-5"></i>
                </button>
                <button id="videoCallCameraBtn" onclick="toggleVideoCallCamera()" class="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white border border-white/5 rounded-full flex items-center justify-center transition btn-anim shadow-lg">
                    <i data-lucide="video" class="w-5 h-5"></i>
                </button>
            `;
        } else {
            container.innerHTML = `
                <button id="callMuteBtn" onclick="toggleCallMute()" class="w-14 h-14 bg-slate-800 hover:bg-slate-750 text-white rounded-full flex items-center justify-center transition btn-anim shadow-lg">
                    <i data-lucide="mic-off" class="w-5 h-5"></i>
                </button>
                <button onclick="endAudioCall()" class="w-16 h-16 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition btn-anim shadow-xl transform hover:rotate-90">
                    <i data-lucide="phone-off" class="w-6 h-6"></i>
                </button>
                <button id="callSpeakerBtn" onclick="toggleCallSpeaker()" class="w-14 h-14 bg-slate-800 hover:bg-slate-750 text-white rounded-full flex items-center justify-center transition btn-anim shadow-lg">
                    <i data-lucide="volume-2" class="w-5 h-5"></i>
                </button>
            `;
        }
    }
}

// Показ входящего вызова
function showIncomingCallOverlay(callerUsername, chatId, type) {
    activeCallData = {
        chatId: chatId,
        type: type,
        caller: callerUsername,
        recipient: currentUser.username
    };

    // Находим чат отправителя звонка
    const chat = chats.find(c => c.id === chatId);
    const callerName = chat ? chat.name : callerUsername;
    const callerAvatar = chat ? chat.avatar : null;

    isCallActive = true;
    showCallUI(callerName, callerAvatar, type, 'incoming');
    startRingingSound();
}

// Принятие входящего звонка
async function acceptIncomingCall() {
    stopRingingSound();
    playAnswerSound();

    // Оповещаем звонящего
    socket.emit('accept_call', {
        callerUsername: activeCallData.caller,
        recipientUsername: currentUser.username,
        chatId: activeCallData.chatId
    });

    // Записываем входящий принятый вызов в лог на сервер
    const timestamp = `${getCurrentDateString()}, ${getCurrentTime()}`;
    fetch('/api/calls/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chatId: activeCallData.chatId,
            caller: activeCallData.caller,
            type: activeCallData.type,
            incoming: true,
            missed: false,
            timestamp
        })
    });

    // Меняем кнопки на стандартную панель управления звонком
    const isVideo = activeCallData.type === 'video';
    const overlayId = isVideo ? 'videoCallOverlay' : 'callOverlay';
    setupCallButtons(overlayId, 'outgoing');

    const dict = translations[currentLang];
    const stateId = isVideo ? 'videoCallState' : 'callState';
    const stateEl = document.getElementById(stateId);

    if (isVideo) {
        document.getElementById('videoCallRemoteCalling').classList.add('hidden');
        document.getElementById('videoCallRemotePlaceholder').classList.remove('hidden');
        stateEl.innerText = dict.videoCallStateActive;
        
        // Запуск камеры
        await setupCamera();
    } else {
        stateEl.innerText = "00:00";
        callSecondsElapsed = 0;
        callTimer = setInterval(() => {
            callSecondsElapsed++;
            const mins = Math.floor(callSecondsElapsed / 60);
            const secs = callSecondsElapsed % 60;
            stateEl.innerText = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }, 1000);
    }
    try { lucide.createIcons(); } catch (e) {}
}

// Отклонение входящего вызова
function declineIncomingCall() {
    handleCallTermination(true);
}

// Завершение звонка (исходящего)
function endAudioCall() {
    handleCallTermination(true);
}

function endVideoCall() {
    handleCallTermination(true);
}

function handleCallTermination(notifyRemote = true) {
    isCallActive = false;
    stopRingingSound();
    clearTimeout(window.callTimeoutTimer);
    
    if (callTimer) {
        clearInterval(callTimer);
        callTimer = null;
    }

    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    const localVideoElement = document.getElementById('localVideo');
    if (localVideoElement) localVideoElement.srcObject = null;

    // Скрываем оверлеи звонка
    document.getElementById('callOverlay').classList.add('hidden');
    document.getElementById('videoCallOverlay').classList.add('hidden');

    if (notifyRemote && activeCallData) {
        socket.emit('reject_or_end_call', {
            recipientUsername: activeCallData.recipient,
            callerUsername: activeCallData.caller,
            chatId: activeCallData.chatId
        });
    }

    activeCallData = null;
}

// Настройка локальной камеры (видеозвонки)
async function setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        runCameraSimulation();
        return;
    }

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoEl = document.getElementById('localVideo');
        videoEl.srcObject = localStream;
        videoEl.classList.remove('hidden');
    } catch (e) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const videoEl = document.getElementById('localVideo');
            videoEl.srcObject = localStream;
            videoEl.classList.remove('hidden');
        } catch (err) {
            runCameraSimulation();
        }
    }
}

function runCameraSimulation() {
    document.getElementById('localVideo').classList.add('hidden');
    document.getElementById('localVideoPlaceholder').classList.add('hidden');
    document.getElementById('localVideoSimulated').classList.remove('hidden');
    try { lucide.createIcons(); } catch (e) {}
}

function toggleVideoCallCamera() {
    isCameraOn = !isCameraOn;
    if (localStream) {
        localStream.getVideoTracks().forEach(track => track.enabled = isCameraOn);
    }

    const btn = document.getElementById('videoCallCameraBtn');
    const videoEl = document.getElementById('localVideo');
    const placeholder = document.getElementById('localVideoPlaceholder');
    const simulatedEl = document.getElementById('localVideoSimulated');

    if (isCameraOn) {
        btn.classList.add('bg-indigo-600', 'hover:bg-indigo-500');
        btn.classList.remove('bg-slate-800', 'hover:bg-slate-700', 'text-red-400');
        btn.innerHTML = '<i data-lucide="video" class="w-5 h-5"></i>';
        
        if (localStream) {
            videoEl.classList.remove('hidden');
            simulatedEl.classList.add('hidden');
        } else {
            simulatedEl.classList.remove('hidden');
        }
        placeholder.classList.add('hidden');
    } else {
        btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-500');
        btn.classList.add('bg-slate-800', 'hover:bg-slate-700', 'text-red-400');
        btn.innerHTML = '<i data-lucide="video-off" class="w-5 h-5"></i>';
        
        videoEl.classList.add('hidden');
        simulatedEl.classList.add('hidden');
        placeholder.classList.remove('hidden');
    }
    try { lucide.createIcons(); } catch (e) {}
}

function toggleCallMute() {
    isMuted = !isMuted;
    const audioBtn = document.getElementById('callMuteBtn');
    const videoBtn = document.getElementById('videoCallMuteBtn');

    const styleMute = (btn) => {
        if (!btn) return;
        if (isMuted) {
            btn.classList.remove('bg-slate-800', 'hover:bg-slate-700');
            btn.classList.add('bg-red-500/20', 'text-red-500', 'hover:bg-red-500/30');
            btn.innerHTML = '<i data-lucide="mic" class="w-5 h-5"></i>';
        } else {
            btn.classList.add('bg-slate-800', 'hover:bg-slate-700');
            btn.classList.remove('bg-red-500/20', 'text-red-500', 'hover:bg-red-500/30');
            btn.innerHTML = '<i data-lucide="mic-off" class="w-5 h-5"></i>';
        }
    };
    styleMute(audioBtn);
    styleMute(videoBtn);
    
    if (localStream) {
        localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
    }
    try { lucide.createIcons(); } catch (e) {}
}

function toggleCallSpeaker() {
    isSpeaker = !isSpeaker;
    const btn = document.getElementById('callSpeakerBtn');
    if (!btn) return;
    if (isSpeaker) {
        btn.classList.remove('bg-slate-800', 'hover:bg-slate-700');
        btn.classList.add('bg-indigo-600', 'hover:bg-indigo-500');
    } else {
        btn.classList.add('bg-slate-800', 'hover:bg-slate-700');
        btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-500');
    }
}

// --- МЕЛОДИИ ВЫЗОВА (WEB AUDIO API) ---
function startRingingSound() {
    try {
        callAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        function playSingleRing() {
            if (!callAudioCtx || callAudioCtx.state === 'closed') return;
            
            callOsc1 = callAudioCtx.createOscillator();
            callOsc2 = callAudioCtx.createOscillator();
            callGain = callAudioCtx.createGain();
            
            callOsc1.type = 'sine';
            callOsc1.frequency.setValueAtTime(400, callAudioCtx.currentTime);
            callOsc2.type = 'sine';
            callOsc2.frequency.setValueAtTime(450, callAudioCtx.currentTime);
            
            callGain.gain.setValueAtTime(0, callAudioCtx.currentTime);
            callGain.gain.linearRampToValueAtTime(0.07, callAudioCtx.currentTime + 0.1);
            callGain.gain.setValueAtTime(0.07, callAudioCtx.currentTime + 1.2);
            callGain.gain.exponentialRampToValueAtTime(0.001, callAudioCtx.currentTime + 1.4);
            
            callOsc1.connect(callGain);
            callOsc2.connect(callGain);
            callGain.connect(callAudioCtx.destination);
            
            callOsc1.start();
            callOsc2.start();
            
            setTimeout(() => {
                try {
                    if (callOsc1) callOsc1.stop();
                    if (callOsc2) callOsc2.stop();
                } catch(e){}
            }, 1400);
        }
        
        playSingleRing();
        ringInterval = setInterval(playSingleRing, 4000);
    } catch (e) {}
}

function stopRingingSound() {
    if (ringInterval) {
        clearInterval(ringInterval);
        ringInterval = null;
    }
    try {
        if (callOsc1) { callOsc1.stop(); callOsc1 = null; }
        if (callOsc2) { callOsc2.stop(); callOsc2 = null; }
    } catch(e){}
}

function playAnswerSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch(e){}
}

function playSentSound() {
    if (!soundEffectsEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
}

function playReceivedSound() {
    if (!soundEffectsEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(783.99, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.10, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
}

// --- УПРАВЛЕНИЕ НАСТРОЙКАМИ И ПРОФИЛЕМ ---

// Открыть / Закрыть настройки
function toggleSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.classList.toggle('hidden');
    
    if (!modal.classList.contains('hidden')) {
        document.getElementById('settingsProfileName').value = userProfile.display_name;
        document.getElementById('settingsProfileBio').value = userProfile.bio || "";
        document.getElementById('settingsProfilePhone').value = userProfile.phone || "";
        document.getElementById('settingsProfilePic').src = userProfile.avatar || defaultBlankAvatar;
        
        document.getElementById('settingsLang').value = currentLang;
        document.getElementById('settingsTheme').value = currentTheme;

        document.getElementById('settingsBgColor').value = userProfile.chatBgColor || "#020617";
        document.getElementById('settingsMyBubbleColor').value = userProfile.myBubbleColor || "#4f46e5";
        document.getElementById('settingsMyTextColor').value = userProfile.myTextColor || "#ffffff";
        document.getElementById('settingsTheirBubbleColor').value = userProfile.theirBubbleColor || "#1e293b";
        document.getElementById('settingsTheirTextColor').value = userProfile.theirTextColor || "#f1f5f9";

        document.getElementById('settingsSoundEffects').checked = soundEffectsEnabled;
        document.getElementById('settingsEnterSend').checked = enterSendEnabled;
        document.getElementById('settingsTypingDelay').checked = typingDelayEnabled;
        document.getElementById('settingsCompactMode').checked = compactModeEnabled;
        document.getElementById('settingsPrivacyLastSeen').value = lastSeenPrivacy;
        document.getElementById('settingsDisappearing').value = disappearingMsgs;
    }
    try {
        lucide.createIcons();
    } catch (e) {}
}

// Сохранить настройки на сервере
async function saveSettings() {
    const displayName = document.getElementById('settingsProfileName').value.trim() || "Пользователь";
    const bio = document.getElementById('settingsProfileBio').value.trim();
    const phone = document.getElementById('settingsProfilePhone').value.trim();
    
    currentLang = document.getElementById('settingsLang').value;
    currentTheme = document.getElementById('settingsTheme').value;

    soundEffectsEnabled = document.getElementById('settingsSoundEffects').checked;
    enterSendEnabled = document.getElementById('settingsEnterSend').checked;
    typingDelayEnabled = document.getElementById('settingsTypingDelay').checked;
    compactModeEnabled = document.getElementById('settingsCompactMode').checked;
    lastSeenPrivacy = document.getElementById('settingsPrivacyLastSeen').value;
    disappearingMsgs = document.getElementById('settingsDisappearing').value;

    const chatBgColor = document.getElementById('settingsBgColor').value;
    const myBubbleColor = document.getElementById('settingsMyBubbleColor').value;
    const myTextColor = document.getElementById('settingsMyTextColor').value;
    const theirBubbleColor = document.getElementById('settingsTheirBubbleColor').value;
    const theirTextColor = document.getElementById('settingsTheirTextColor').value;

    // Сначала сохраняем профиль
    try {
        const profRes = await fetch(`/api/profile/${currentUser.username}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ displayName, bio, phone, avatar: userProfile.avatar })
        });
        const profData = await profRes.json();
        if (profData.success) {
            userProfile = profData.profile;
        }

        // Сохраняем остальные настройки
        const settingsRes = await fetch(`/api/settings/${currentUser.username}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                theme: currentTheme,
                lang: currentLang,
                sound_effects: soundEffectsEnabled,
                enter_send: enterSendEnabled,
                typing_delay: typingDelayEnabled,
                compact_mode: compactModeEnabled,
                privacy_last_seen: lastSeenPrivacy,
                disappearing_msgs: disappearingMsgs,
                chat_bg_color: chatBgColor,
                my_bubble_color: myBubbleColor,
                my_text_color: myTextColor,
                their_bubble_color: theirBubbleColor,
                their_text_color: theirTextColor
            })
        });
        const settingsData = await settingsRes.json();
        
        if (settingsData.success) {
            await loadSettings();
            applyLanguage();
            applyAppTheme();
            applyProfile();
            renderMessages();
            renderChats();
            toggleSettingsModal();
        }
    } catch(e) {
        console.error("Error saving settings:", e);
    }
}

// Загрузка аватарки в настройках
async function handleProfilePicUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const response = await fetch(`/api/profile/${currentUser.username}/avatar`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            userProfile.avatar = data.profile.avatar;
            document.getElementById('settingsProfilePic').src = data.profile.avatar;
        }
    } catch(e) {
        console.error("Error uploading avatar:", e);
    }
}

// Загрузка аватарки кликом по кругу карточки профиля
async function handleDirectAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const response = await fetch(`/api/profile/${currentUser.username}/avatar`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            userProfile.avatar = data.profile.avatar;
            applyProfile();
            document.getElementById('infoModalAvatar').src = data.profile.avatar;
        }
    } catch(e) {
        console.error("Error uploading direct avatar:", e);
    }
}

// Просмотр карточки профиля
async function openProfileInfo(event, type, contactId = null) {
    if (event) event.stopPropagation();

    const modal = document.getElementById('profileInfoModal');
    const avatarImg = document.getElementById('infoModalAvatar');
    const nameText = document.getElementById('infoModalName');
    const statusText = document.getElementById('infoModalStatus');
    const bioText = document.getElementById('infoModalBio');
    const phoneText = document.getElementById('infoModalPhone');

    const avatarContainer = document.getElementById('infoModalAvatarContainer');
    const avatarHover = document.getElementById('infoModalAvatarHover');
    const dict = translations[currentLang];

    if (type === 'me') {
        avatarImg.src = userProfile.avatar || defaultBlankAvatar;
        nameText.innerText = getLocalizedName({ username: currentUser.username, name: userProfile.display_name });
        statusText.innerText = lastSeenPrivacy === 'nobody' ? '' : `${dict.onlineStatus} (${dict.appName})`;
        
        let bioVal = userProfile.bio;
        if (currentUser.username === 'admin' && (userProfile.bio === "" || !userProfile.bio)) {
            bioVal = dict.bioAdmin;
        }
        bioText.innerText = bioVal || "";
        phoneText.innerText = userProfile.phone || "";

        avatarContainer.style.cursor = 'pointer';
        if (avatarHover) avatarHover.classList.remove('hidden');
        avatarContainer.onclick = function() {
            document.getElementById('directAvatarInput').click();
        };
    } else {
        const lookupId = contactId || activeChatId;
        const chat = chats.find(c => String(c.id) === String(lookupId));
        if (!chat) return;
        avatarImg.src = chat.avatar || defaultBlankAvatar;
        nameText.innerText = getLocalizedName(chat);

        let localizedStatus = chat.status;
        if (chat.status === "в сети") localizedStatus = dict.onlineStatus;
        else if (chat.status === "был(а) недавно") localizedStatus = dict.offlineStatus;
        else if (chat.status === "групповой чат") localizedStatus = dict.groupChatStatus;
        statusText.innerText = localizedStatus;

        let bioVal = chat.bio || "";
        if (chat.id === 1) bioVal = dict.bioAlice;
        else if (chat.id === 2) bioVal = dict.bioBob;
        bioText.innerText = bioVal;
        phoneText.innerText = chat.phone || "";

        avatarContainer.style.cursor = 'default';
        if (avatarHover) avatarHover.classList.add('hidden');
        avatarContainer.onclick = null;
    }

    modal.classList.remove('hidden');
    try {
        lucide.createIcons();
    } catch (e) {}
}

function toggleProfileInfoModal() {
    document.getElementById('profileInfoModal').classList.add('hidden');
}

// Применить тему и язык оформления
function applyAppTheme() {
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }

    if (compactModeEnabled) {
        document.body.classList.add('compact-mode');
    } else {
        document.body.classList.remove('compact-mode');
    }
}

// Применить переводы
function applyLanguage() {
    const dict = translations[currentLang];
    if (!dict) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = dict[key];
            } else if (el.tagName === 'BUTTON' && el.id === 'phoneContactsBtn') {
                el.title = dict[key];
            } else {
                el.innerText = dict[key];
            }
        }
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.placeholder = dict.searchPlaceholder;

    const messageInput = document.getElementById('messageInput');
    if (messageInput) messageInput.placeholder = dict.messageInputPlaceholder;
}

function setLanguage(lang) {
    currentLang = lang;
    applyLanguage();
    renderChats();
    if (activeChatId) selectChat(activeChatId);
    
    // Сохраняем язык на бэкенд
    if (currentUser) {
        fetch(`/api/settings/${currentUser.username}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...userProfile, lang: currentLang })
        });
    }
}

// Отрисовка панели смайликов
function initEmojiPanel() {
    const panel = document.getElementById('emojiPanel');
    if (!panel) return;
    panel.innerHTML = '';
    
    for (const [categoryName, emojis] of Object.entries(emojiCategories)) {
        const catDiv = document.createElement('div');
        catDiv.className = 'space-y-1';
        catDiv.innerHTML = `
            <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mt-2">${categoryName}</span>
            <div class="grid grid-cols-8 gap-1.5 mt-1">
                ${emojis.map(emoji => `
                    <button type="button" onclick="insertEmoji('${emoji}')" class="text-xl hover:scale-125 transition btn-anim w-8 h-8 flex items-center justify-center">${emoji}</button>
                `).join('')}
            </div>
        `;
        panel.appendChild(catDiv);
    }
}

function toggleEmojiPanel() {
    const panel = document.getElementById('emojiPanel');
    panel.classList.toggle('hidden');
}

function closeEmojiPanel() {
    const panel = document.getElementById('emojiPanel');
    if (panel) panel.classList.add('hidden');
}

function insertEmoji(emoji) {
    const input = document.getElementById('messageInput');
    input.value += emoji;
    input.focus();
}

// --- АВТОРИЗАЦИЯ, ВЫХОД, РЕГИСТРАЦИЯ ---

function switchAuthMode(mode) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotForm = document.getElementById('forgotForm');
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const dict = translations[currentLang];

    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        forgotForm.classList.add('hidden');
        title.innerText = dict.authTitle;
        subtitle.innerText = dict.authSubtitle;
    } else if (mode === 'register') {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        forgotForm.classList.add('hidden');
        title.innerText = dict.regTitle;
        subtitle.innerText = dict.regSubtitle;
    } else if (mode === 'forgot') {
        loginForm.classList.add('hidden');
        registerForm.classList.add('hidden');
        forgotForm.classList.remove('hidden');
        title.innerText = dict.forgotTitle;
        subtitle.innerText = dict.forgotSubtitle;
    }
    try { lucide.createIcons(); } catch (e) {}
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim().toLowerCase();
    const displayName = document.getElementById('regDisplayName').value.trim();
    const password = document.getElementById('regPassword').value;
    const phone = document.getElementById('regPhone').value.trim();
    const bio = document.getElementById('regBio').value.trim();

    if (username.length < 3 || password.length < 4) {
        showCustomAlert("Ошибка / Error", "usernameLengthError", null);
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, displayName, bio, phone })
        });
        const data = await response.json();
        
        if (data.success) {
            showCustomAlert(
                "regSuccessTitle", 
                "regSuccessMsg", 
                function() {
                    switchAuthMode('login');
                }
            );
            document.getElementById('registerForm').reset();
        } else {
            showCustomAlert("Внимание / Warning", data.error, null);
        }
    } catch(err) {
        console.error(err);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('gzafchat_current_user', JSON.stringify(currentUser));
            document.getElementById('loginForm').reset();
            checkAuth();
        } else {
            showCustomAlert("Ошибка входа / Error", data.error, null);
        }
    } catch(err) {
        console.error(err);
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const username = document.getElementById('forgotUsername').value.trim().toLowerCase();
    const phone = document.getElementById('forgotPhone').value.trim();
    const newPassword = document.getElementById('forgotNewPassword').value;

    if (newPassword.length < 4) {
        showCustomAlert("Ошибка / Error", "usernameLengthError", null);
        return;
    }

    try {
        const response = await fetch('/api/auth/forgot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, phone, newPassword })
        });
        const data = await response.json();
        if (data.success) {
            showCustomAlert(
                "forgotSuccessTitle", 
                "forgotSuccessMsg", 
                function() {
                    switchAuthMode('login');
                }
            );
            document.getElementById('forgotForm').reset();
        } else {
            showCustomAlert("Ошибка / Error", data.error, null);
        }
    } catch(err) {
        console.error(err);
    }
}

function handleLogout() {
    const dict = translations[currentLang];
    if (confirm(dict.logoutConfirm)) {
        localStorage.removeItem('gzafchat_current_user');
        currentUser = null;
        userProfile = null;
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        checkAuth();
    }
}

// --- СОЗДАНИЕ ГРУППЫ ---
function toggleGroupModal() {
    const modal = document.getElementById('groupModal');
    modal.classList.toggle('hidden');
    const dict = translations[currentLang];
    
    if (!modal.classList.contains('hidden')) {
        document.getElementById('groupNameInput').value = '';
        const listContainer = document.getElementById('groupMembersList');
        listContainer.innerHTML = '';
        
        const individualContacts = chats.filter(c => !c.isGroup);
        
        // Добавляем ботов в список участников для создания группы
        const botContacts = [
            { username: 'alice', display_name: dict.nameAlice, avatar: aliceAvatar },
            { username: 'bob', display_name: dict.nameBob, avatar: bobAvatar }
        ];
        
        // Объединяем контакты, избегая дубликатов
        const allContacts = [...individualContacts];
        botContacts.forEach(bot => {
            if (!allContacts.some(c => c.username === bot.username)) {
                allContacts.push(bot);
            }
        });
        
        if (allContacts.length === 0) {
            listContainer.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">${dict.noContacts}</p>`;
            return;
        }
        
        allContacts.forEach(contact => {
            const dispName = contact.display_name || getLocalizedName(contact);
            const row = document.createElement('label');
            row.className = 'flex items-center justify-between p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition';
            row.innerHTML = `
                <div class="flex items-center space-x-3">
                    <img src="${contact.avatar || defaultBlankAvatar}" class="w-8 h-8 rounded-full object-cover">
                    <span class="text-xs font-medium text-slate-200">${dispName}</span>
                </div>
                <input type="checkbox" name="groupMemberCheckbox" value="${contact.username}" class="w-4 h-4 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950">
            `;
            listContainer.appendChild(row);
        });
    }
    try { lucide.createIcons(); } catch(e) {}
}

async function createGroup() {
    const groupName = document.getElementById('groupNameInput').value.trim();
    const dict = translations[currentLang];
    if (!groupName) {
        alert(dict.enterGroupName);
        return;
    }
    
    const checkedBoxes = document.querySelectorAll('input[name="groupMemberCheckbox"]:checked');
    if (checkedBoxes.length === 0) {
        alert(dict.selectOneMember);
        return;
    }
    
    const selectedUsernames = Array.from(checkedBoxes).map(cb => cb.value);
    
    try {
        const response = await fetch('/api/chats/create-group', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: groupName,
                members: selectedUsernames,
                owner: currentUser.username
            })
        });
        const data = await response.json();
        
        if (data.success) {
            // Оповещаем сокет о подключении к новой комнате чата
            socket.emit('join_chat', data.chatId);
            
            await loadChats();
            toggleGroupModal();
            selectChat(data.chatId);
            showCustomAlert("groupCreatedMsg", dict.systemGroupCreated.replace('{groupName}', groupName));
        }
    } catch (e) {
        console.error("Error creating group:", e);
    }
}

// --- ТЕЛЕФОННЫЕ КОНТАКТЫ (ИМПОРТ VCF И ДОБАВЛЕНИЕ) ---
async function togglePhoneContactsModal() {
    const modal = document.getElementById('phoneContactsModal');
    const list = document.getElementById('phoneContactsList');
    const dict = translations[currentLang];
    
    const isContactsAPISupported = ('contacts' in navigator && 'ContactsManager' in window);
    
    if (isContactsAPISupported) {
        try {
            const props = ['name', 'tel'];
            const opts = { multiple: true };
            const realContacts = await navigator.contacts.select(props, opts);
            
            if (realContacts && realContacts.length > 0) {
                modal.classList.remove('hidden');
                list.innerHTML = '';
                
                realContacts.forEach(contact => {
                    const name = contact.name ? contact.name[0] : 'No Name';
                    const phone = contact.tel ? contact.tel[0] : 'No Phone';
                    const initial = name ? name[0].toUpperCase() : '?';
                    
                    const row = document.createElement('div');
                    row.className = 'flex items-center justify-between p-3 bg-slate-900 border border-slate-800/80 rounded-xl hover:border-indigo-500/55 transition duration-150';
                    row.innerHTML = `
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30 text-sm">
                                ${initial}
                            </div>
                            <div>
                                <h4 class="font-bold text-slate-200 text-xs">${name}</h4>
                                <p class="text-[10px] text-slate-400 font-mono mt-0.5">${phone}</p>
                            </div>
                        </div>
                        <button onclick="inviteContact('${name.replace(/'/g, "\\'")}', '${phone}')" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition btn-anim uppercase tracking-wider">
                            ${dict.inviteBtn}
                        </button>
                    `;
                    list.appendChild(row);
                });
                try { lucide.createIcons(); } catch(e) {}
                return;
            }
        } catch (err) {
            console.warn("Contacts API not supported or user denied access.", err);
        }
    }
    
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
        renderFallbackContacts();
    }
}

function renderFallbackContacts() {
    const list = document.getElementById('phoneContactsList');
    const dict = translations[currentLang];
    list.innerHTML = '';
    
    // Подгружаем контакты из локального хранилища, если есть
    try {
        mockPhoneContacts = JSON.parse(localStorage.getItem('gzafchat_phone_contacts')) || [];
    } catch(e) {
        mockPhoneContacts = [];
    }

    if (mockPhoneContacts.length === 0) {
        list.innerHTML = `
            <div class="text-center py-8 px-4">
                <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
                    <i data-lucide="users-round" class="w-6 h-6"></i>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">
                    Ваш браузер не поддерживает прямое чтение контактов устройства.
                    Вы можете импортировать .vcf файл или добавить контакт вручную.
                </p>
            </div>
        `;
        try { lucide.createIcons(); } catch(e) {}
        return;
    }
    
    mockPhoneContacts.forEach((contact, idx) => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-3 bg-slate-900 border border-slate-800/80 rounded-xl hover:border-indigo-500/50 transition duration-150';
        row.innerHTML = `
            <div class="flex items-center space-x-3">
                <img src="${contact.avatar || defaultBlankAvatar}" class="w-10 h-10 rounded-full object-cover border border-slate-800">
                <div>
                    <h4 class="font-bold text-slate-200 text-xs">${contact.name}</h4>
                    <p class="text-[10px] text-slate-400 font-mono mt-0.5">${contact.phone}</p>
                </div>
            </div>
            <button onclick="inviteContact('${contact.name.replace(/'/g, "\\'")}', '${contact.phone}')" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition btn-anim uppercase tracking-wider">
                ${dict.inviteBtn}
            </button>
        `;
        list.appendChild(row);
    });
    try { lucide.createIcons(); } catch(e) {}
}

function handleVCFImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const imported = parseVCF(text);
        if (imported.length > 0) {
            mockPhoneContacts = [...imported, ...mockPhoneContacts];
            localStorage.setItem('gzafchat_phone_contacts', JSON.stringify(mockPhoneContacts));
            renderFallbackContacts();
            showCustomAlert("Успешно", `Импортировано контактов: ${imported.length}`, null, true);
        } else {
            showCustomAlert("Внимание", "Не удалось обнаружить валидные контакты в этом .vcf файле.", null, true);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function parseVCF(vcfText) {
    const contacts = [];
    const lines = vcfText.split(/\r?\n/);
    let currentContact = {};
    for (let line of lines) {
        line = line.trim();
        if (line === "BEGIN:VCARD") {
            currentContact = {};
        } else if (line === "END:VCARD") {
            if (currentContact.name && currentContact.phone) {
                contacts.push({
                    name: currentContact.name,
                    phone: currentContact.phone,
                    avatar: defaultBlankAvatar
                });
            }
        } else if (line.startsWith("FN:")) {
            currentContact.name = line.substring(3).trim();
        } else if (line.startsWith("TEL")) {
            const colonIdx = line.indexOf(":");
            if (colonIdx !== -1) {
                currentContact.phone = line.substring(colonIdx + 1).trim();
            }
        }
    }
    return contacts;
}

function addManualContact() {
    const nameInput = document.getElementById('manualContactName');
    const phoneInput = document.getElementById('manualContactPhone');
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || !phone) {
        alert("Заполните имя и номер телефона!");
        return;
    }

    const newContact = {
        name: name,
        phone: phone,
        avatar: defaultBlankAvatar
    };

    mockPhoneContacts.unshift(newContact);
    localStorage.setItem('gzafchat_phone_contacts', JSON.stringify(mockPhoneContacts));
    
    nameInput.value = '';
    phoneInput.value = '';
    renderFallbackContacts();
}

function inviteContact(name, phone) {
    const dict = translations[currentLang];
    const msg = dict.invitationSentMsg.replace('{phone}', phone);
    showCustomAlert("invitationSentTitle", msg, null, true);
}

// --- УВЕДОМЛЕНИЯ И СЕРВИСНЫЕ МЕТОДЫ ---
function showCustomAlert(titleKey, messageKey, callback, isRawText = false) {
    const dict = translations[currentLang];
    const title = isRawText ? titleKey : (dict[titleKey] || titleKey);
    const msg = isRawText ? messageKey : (dict[messageKey] || messageKey);

    document.getElementById('customAlertTitle').innerText = title;
    document.getElementById('customAlertMsg').innerText = msg;
    
    const alertModal = document.getElementById('customAlert');
    alertModal.classList.remove('hidden');
    try { lucide.createIcons(); } catch (e) {}
    
    window.customAlertCallback = callback;
}

function closeCustomAlert() {
    document.getElementById('customAlert').classList.add('hidden');
    if (typeof window.customAlertCallback === 'function') {
        window.customAlertCallback();
        window.customAlertCallback = null;
    }
}

async function resetApp() {
    const dict = translations[currentLang];
    if (confirm(dict.resetConfirm)) {
        try {
            await fetch('/api/reset', { method: 'POST' });
            localStorage.clear();
            location.reload();
        } catch(e) {
            console.error(e);
        }
    }
}

// Вспомогательные хелперы
function getCurrentTime() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

function getCurrentDateString() {
    const date = new Date();
    const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    return `${date.getDate()} ${months[date.getMonth()]}`;
}

// Экспорт методов в глобальную область видимости (чтобы onclick работали из HTML)
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleForgotPassword = handleForgotPassword;
window.handleLogout = handleLogout;
window.setLanguage = setLanguage;
window.switchAuthMode = switchAuthMode;
window.toggleSettingsModal = toggleSettingsModal;
window.saveSettings = saveSettings;
window.toggleProfileInfoModal = toggleProfileInfoModal;
window.openProfileInfo = openProfileInfo;
window.handleProfilePicUpload = handleProfilePicUpload;
window.handleDirectAvatarUpload = handleDirectAvatarUpload;
window.filterChats = filterChats;
window.selectChat = selectChat;
window.backToSidebar = backToSidebar;
window.handleSend = handleSend;
window.handleImageUpload = handleImageUpload;
window.toggleVoiceRecord = toggleVoiceRecord;
window.playVoiceMessageSimulation = playVoiceMessageSimulation;
window.switchTab = switchTab;
window.handleAddStatus = handleAddStatus;
window.viewMyStatus = viewMyStatus;
window.closeStatusViewer = closeStatusViewer;
window.clearCallHistory = clearCallHistory;
window.startAudioCall = startAudioCall;
window.startVideoCall = startVideoCall;
window.endAudioCall = endAudioCall;
window.endVideoCall = endVideoCall;
window.toggleCallMute = toggleCallMute;
window.toggleCallSpeaker = toggleCallSpeaker;
window.toggleVideoCallCamera = toggleVideoCallCamera;
window.toggleEmojiPanel = toggleEmojiPanel;
window.insertEmoji = insertEmoji;
window.togglePhoneContactsModal = togglePhoneContactsModal;
window.handleVCFImport = handleVCFImport;
window.addManualContact = addManualContact;
window.inviteContact = inviteContact;
window.closeCustomAlert = closeCustomAlert;
window.toggleGroupModal = toggleGroupModal;
window.createGroup = createGroup;
window.resetApp = resetApp;

window.onload = init;
