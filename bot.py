import telebot
import sqlite3
import random
import string
from datetime import datetime
import threading

BOT_TOKEN = "8203156591:AAFfmcBoKAa8ZFU4AQMzEON6dNMzOGVw1K0"
bot = telebot.TeleBot(BOT_TOKEN)

def get_db_connection():
    conn = sqlite3.connect('erax.db')
    conn.row_factory = sqlite3.Row
    return conn

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=4))

def format_phone(phone):
    phone = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
    if phone.startswith('998'):
        phone = '+' + phone
    elif not phone.startswith('+998'):
        phone = '+998' + phone
    return phone

@bot.message_handler(commands=['start'])
def start_message(message):
    user_id = message.from_user.id
    username = message.from_user.username or message.from_user.first_name
    
    # Parametrli start
    if len(message.text.split()) > 1:
        param = message.text.split()[1]
        if param.startswith('verify_'):
            phone = '+' + param.replace('verify_', '')
            handle_verification_start(message, phone)
            return
    
    # Telefon raqam so'rash
    markup = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True, one_time_keyboard=True)
    contact_btn = telebot.types.KeyboardButton('📱 Telefon raqamni yuborish', request_contact=True)
    markup.add(contact_btn)
    
    welcome_text = f"""
🏢 Erax Sklad Bot

👋 Salom {username}!

Telefon raqamingizni yuboring:
"""
    
    bot.send_message(message.chat.id, welcome_text, reply_markup=markup)

def handle_verification_start(message, expected_phone):
    user_id = message.from_user.id
    
    # Telefon raqam so'rash
    markup = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True, one_time_keyboard=True)
    contact_btn = telebot.types.KeyboardButton('📱 Telefon raqamni yuborish', request_contact=True)
    markup.add(contact_btn)
    
    verification_text = f"""
📱 Telefon raqam tasdiqlash

Saytda kiritilgan: {expected_phone}

Telefon raqamingizni yuboring:
"""
    
    # Kutilayotgan telefon raqamni saqlash
    conn = get_db_connection()
    conn.execute('''
        INSERT OR REPLACE INTO verification_codes 
        (user_id, phone, code, created_at) 
        VALUES (?, ?, '', ?)
    ''', (user_id, expected_phone, datetime.now()))
    conn.commit()
    conn.close()
    
    bot.send_message(message.chat.id, verification_text, reply_markup=markup)

@bot.message_handler(content_types=['contact'])
def handle_contact(message):
    user_id = message.from_user.id
    received_phone = format_phone(message.contact.phone_number)
    
    conn = get_db_connection()
    
    # Foydalanuvchi holatini tekshirish
    state = conn.execute('''
        SELECT state FROM user_states 
        WHERE user_id = ? AND datetime(created_at) > datetime('now', '-5 minutes')
        ORDER BY created_at DESC LIMIT 1
    ''', (user_id,)).fetchone()
    
    if state and state['state'] == 'get_id':
        # Sklad ID olish
        warehouse = conn.execute('''
            SELECT warehouse_id FROM users 
            WHERE phone = ? AND role IN ('boss', 'admin')
        ''', (received_phone,)).fetchone()
        
        # Get_id holatini o'chirish
        conn.execute('DELETE FROM user_states WHERE user_id = ?', (user_id,))
        conn.commit()
        
        markup = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True)
        markup.row('📞 Support', '🆔 Sklad ID olish')
        
        if warehouse:
            warehouse_id = warehouse['warehouse_id']
            bot.send_message(message.chat.id, f"✅ Sklad ID: {warehouse_id}", reply_markup=markup)
        else:
            bot.send_message(message.chat.id, "❌ Sklad topilmadi", reply_markup=markup)
    else:
        # Verification uchun
        verification = conn.execute('''
            SELECT phone FROM verification_codes 
            WHERE user_id = ? AND datetime(created_at) > datetime('now', '-10 minutes')
            ORDER BY created_at DESC LIMIT 1
        ''', (user_id,)).fetchone()
        
        if verification:
            expected_phone = verification['phone']
            
            if received_phone == expected_phone:
                code = generate_verification_code()
                conn.execute('''
                    UPDATE verification_codes 
                    SET code = ? 
                    WHERE user_id = ? AND phone = ?
                ''', (code, user_id, expected_phone))
                conn.commit()
                
                markup = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True)
                markup.row('📞 Support', '🆔 Sklad ID olish')
                
                bot.send_message(message.chat.id, f"✅ Kod: {code}", reply_markup=markup)
            else:
                bot.send_message(message.chat.id, f"❌ Raqamlar mos kelmadi!\nKutilgan: {expected_phone}\nYuborilgan: {received_phone}")
        else:
            markup = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True)
            markup.row('📞 Support', '🆔 Sklad ID olish')
            bot.send_message(message.chat.id, "✅ Xush kelibsiz!", reply_markup=markup)
    
    conn.close()

@bot.message_handler(func=lambda message: message.text == '📞 Support')
def support_handler(message):
    user_id = message.from_user.id
    username = message.from_user.username or message.from_user.first_name
    
    support_text = """
📞 Support

Xabaringizni yozing:
"""
    
    bot.send_message(message.chat.id, support_text)
    
    conn = get_db_connection()
    conn.execute('''
        INSERT OR REPLACE INTO user_states 
        (user_id, state, created_at) 
        VALUES (?, 'support', ?)
    ''', (user_id, datetime.now()))
    conn.commit()
    conn.close()

@bot.message_handler(func=lambda message: message.text == '🆔 Sklad ID olish')
def get_warehouse_id(message):
    user_id = message.from_user.id
    
    markup = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True, one_time_keyboard=True)
    contact_btn = telebot.types.KeyboardButton('📱 Telefon raqamni yuborish', request_contact=True)
    markup.add(contact_btn)
    
    bot.send_message(message.chat.id, "🆔 Telefon raqamingizni yuboring:", reply_markup=markup)
    
    conn = get_db_connection()
    conn.execute('''
        INSERT OR REPLACE INTO user_states 
        (user_id, state, created_at) 
        VALUES (?, 'get_id', ?)
    ''', (user_id, datetime.now()))
    conn.commit()
    conn.close()

@bot.message_handler(func=lambda message: True)
def handle_messages(message):
    user_id = message.from_user.id
    username = message.from_user.username or message.from_user.first_name
    
    conn = get_db_connection()
    state = conn.execute('''
        SELECT state FROM user_states 
        WHERE user_id = ? AND datetime(created_at) > datetime('now', '-30 minutes')
        ORDER BY created_at DESC LIMIT 1
    ''', (user_id,)).fetchone()
    
    if state and state['state'] == 'support':
        # Support xabarini saqlash
        message_id = conn.execute('''
            INSERT INTO support_messages 
            (user_id, username, message, created_at) 
            VALUES (?, ?, ?, ?)
        ''', (user_id, username, message.text, datetime.now())).lastrowid
        conn.commit()
        
        # Support holatini o'chirish
        conn.execute('DELETE FROM user_states WHERE user_id = ?', (user_id,))
        conn.commit()
        
        markup = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True)
        markup.row('📞 Support', '🆔 Sklad ID olish')
        
        bot.send_message(message.chat.id, "✅ Xabar yuborildi!", reply_markup=markup)
        
        # Adminga inline tugma bilan xabar
        admin_markup = telebot.types.InlineKeyboardMarkup()
        reply_btn = telebot.types.InlineKeyboardButton("Javob qaytarish", callback_data=f"reply_{message_id}_{user_id}")
        admin_markup.add(reply_btn)
        
        admin_text = f"""
📞 Yangi support xabari!

👤 {username} (ID: {user_id})
💬 {message.text}
"""
        
        try:
            bot.send_message(6042896170, admin_text, reply_markup=admin_markup)
        except:
            pass
    else:
        # Noto'g'ri xabar
        markup = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True)
        markup.row('📞 Support', '🆔 Sklad ID olish')
        bot.send_message(message.chat.id, "Tugmalardan birini tanlang:", reply_markup=markup)
    
    conn.close()

# Inline tugma bosilganda
@bot.callback_query_handler(func=lambda call: call.data.startswith('reply_'))
def handle_reply_callback(call):
    try:
        _, message_id, user_id = call.data.split('_')
        user_id = int(user_id)
        
        # Admin javob yozishini so'rash
        bot.send_message(call.message.chat.id, f"Javobingizni yozing (User ID: {user_id}):")
        
        # Admin holatini saqlash
        conn = get_db_connection()
        conn.execute('''
            INSERT OR REPLACE INTO user_states 
            (user_id, state, created_at) 
            VALUES (?, ?, ?)
        ''', (call.message.chat.id, f'admin_reply_{user_id}', datetime.now()))
        conn.commit()
        conn.close()
        
        bot.answer_callback_query(call.id, "Javobingizni yozing")
    except:
        bot.answer_callback_query(call.id, "Xatolik yuz berdi")

# Admin javob handler
@bot.message_handler(func=lambda message: message.from_user.id == 6042896170)
def handle_admin_reply(message):
    conn = get_db_connection()
    state = conn.execute('''
        SELECT state FROM user_states 
        WHERE user_id = ? AND state LIKE 'admin_reply_%'
        ORDER BY created_at DESC LIMIT 1
    ''', (message.from_user.id,)).fetchone()
    
    if state:
        target_user_id = int(state['state'].replace('admin_reply_', ''))
        
        # Foydalanuvchiga javob yuborish
        reply_text = f"""
📞 Admin javob:

{message.text}
"""
        
        try:
            bot.send_message(target_user_id, reply_text)
            bot.send_message(message.chat.id, f"✅ Javob yuborildi (User ID: {target_user_id})")
        except:
            bot.send_message(message.chat.id, "❌ Javob yuborishda xatolik")
        
        # Admin holatini o'chirish
        conn.execute('DELETE FROM user_states WHERE user_id = ?', (message.from_user.id,))
        conn.commit()
    
    conn.close()

def init_database():
    conn = get_db_connection()
    
    # Eski jadvalni o'chirish va yangisini yaratish
    conn.execute('DROP TABLE IF EXISTS verification_codes')
    conn.execute('''
        CREATE TABLE verification_codes (
            user_id INTEGER,
            phone TEXT,
            code TEXT,
            created_at TIMESTAMP,
            PRIMARY KEY (user_id, phone)
        )
    ''')
    
    conn.execute('DROP TABLE IF EXISTS user_states')
    conn.execute('''
        CREATE TABLE user_states (
            user_id INTEGER PRIMARY KEY,
            state TEXT,
            created_at TIMESTAMP
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS support_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT,
            message TEXT,
            created_at TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def start_bot():
    init_database()
    print("Bot ishga tushdi...")
    bot.polling(none_stop=True)

if __name__ == '__main__':
    start_bot()