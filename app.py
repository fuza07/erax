from flask import Flask, render_template, request, jsonify, session, redirect, send_from_directory
import sqlite3
from datetime import datetime, timedelta
import secrets
import threading
import subprocess
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = 'erax_sklad_secret_key_2024'

def init_db():
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS warehouses
                 (id TEXT PRIMARY KEY,
                  name TEXT NOT NULL,
                  created_date TEXT NOT NULL,
                  subscription_type TEXT DEFAULT 'trial',
                  subscription_expiry TEXT,
                  enable_images INTEGER DEFAULT 0,
                  enable_orders INTEGER DEFAULT 0,
                  enable_statistics INTEGER DEFAULT 0,
                  enable_chat INTEGER DEFAULT 0,
                  theme TEXT DEFAULT 'ordinary')''')
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  warehouse_id TEXT NOT NULL,
                  username TEXT NOT NULL,
                  phone TEXT,
                  role TEXT NOT NULL,
                  joined_date TEXT NOT NULL,
                  subscription_type TEXT DEFAULT 'trial',
                  subscription_expiry TEXT,
                  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS products
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  warehouse_id TEXT NOT NULL,
                  name TEXT NOT NULL,
                  model TEXT,
                  box_quantity INTEGER DEFAULT 1,
                  items_per_box INTEGER DEFAULT 1,
                  quantity INTEGER NOT NULL,
                  buy_price REAL DEFAULT 0,
                  image_path TEXT,
                  date_added TEXT NOT NULL,
                  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS transactions
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  warehouse_id TEXT NOT NULL,
                  product_name TEXT NOT NULL,
                  quantity INTEGER NOT NULL,
                  price REAL NOT NULL,
                  type TEXT NOT NULL,
                  date TEXT NOT NULL,
                  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS orders
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  warehouse_id TEXT NOT NULL,
                  created_date TEXT NOT NULL,
                  delivered_date TEXT,
                  note TEXT,
                  status TEXT DEFAULT 'active',
                  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS order_items
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  order_id INTEGER NOT NULL,
                  product_name TEXT NOT NULL,
                  model TEXT,
                  box_quantity INTEGER NOT NULL,
                  items_per_box INTEGER NOT NULL,
                  sell_price REAL NOT NULL,
                  from_stock INTEGER DEFAULT 1,
                  FOREIGN KEY (order_id) REFERENCES orders(id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS debts
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  warehouse_id TEXT NOT NULL,
                  debt_type TEXT NOT NULL,
                  person_name TEXT NOT NULL,
                  amount REAL NOT NULL,
                  created_date TEXT NOT NULL,
                  paid INTEGER DEFAULT 0,
                  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS messages
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  warehouse_id TEXT NOT NULL,
                  user_id INTEGER NOT NULL,
                  username TEXT NOT NULL,
                  message TEXT NOT NULL,
                  created_date TEXT NOT NULL,
                  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
                  FOREIGN KEY (user_id) REFERENCES users(id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS verification_codes
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  phone TEXT NOT NULL,
                  code TEXT NOT NULL,
                  created_at TEXT NOT NULL,
                  verified INTEGER DEFAULT 0,
                  user_id INTEGER)''')
    c.execute('''CREATE TABLE IF NOT EXISTS global_settings
                 (id INTEGER PRIMARY KEY CHECK (id = 1),
                  theme TEXT DEFAULT 'ordinary',
                  background_image TEXT)''')
    
    # Initialize global settings if not exists
    c.execute('INSERT OR IGNORE INTO global_settings (id, theme) VALUES (1, "ordinary")')
    
    # Add background_image column if not exists
    try:
        c.execute('ALTER TABLE global_settings ADD COLUMN background_image TEXT')
    except:
        pass
    
    # Create uploads directory
    import os
    if not os.path.exists('static/uploads'):
        os.makedirs('static/uploads')
    
    conn.commit()
    conn.close()

@app.route('/')
def index():
    if 'warehouse_id' not in session:
        return render_template('login.html')
    return render_template('index.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('SELECT id, warehouse_id, username, role FROM users WHERE warehouse_id = ? AND username = ?',
              (data['warehouse_id'], data['username']))
    user = c.fetchone()
    if user:
        c.execute('SELECT name FROM warehouses WHERE id = ?', (user[1],))
        warehouse = c.fetchone()
        conn.close()
        session['user_id'] = user[0]
        session['warehouse_id'] = user[1]
        session['username'] = user[2]
        session['role'] = user[3]
        session['warehouse_name'] = warehouse[0]
        return jsonify({'success': True})
    conn.close()
    return jsonify({'success': False, 'error': 'Foydalanuvchi topilmadi'}), 404

@app.route('/add')
def add_page():
    if 'warehouse_id' not in session:
        return redirect('/')
    return render_template('add.html')

@app.route('/remove')
def remove_page():
    if 'warehouse_id' not in session:
        return redirect('/')
    return render_template('remove.html')

@app.route('/stats')
def stats_page():
    if 'warehouse_id' not in session:
        return redirect('/')
    return render_template('stats.html')

@app.route('/cabinet')
def cabinet():
    if 'warehouse_id' not in session:
        return redirect('/')
    return render_template('cabinet.html')

@app.route('/manage')
def manage():
    if 'warehouse_id' not in session or session.get('role') not in ['boss', 'manager']:
        return redirect('/')
    return render_template('manage.html')

@app.route('/settings')
def settings():
    if 'warehouse_id' not in session or session.get('role') != 'boss':
        return redirect('/')
    return render_template('settings.html')

@app.route('/orders')
def orders_page():
    if 'warehouse_id' not in session:
        return redirect('/')
    return render_template('orders.html')

@app.route('/debts')
def debts_page():
    if 'warehouse_id' not in session:
        return redirect('/')
    return render_template('debts.html')

@app.route('/chat')
def chat_page():
    if 'warehouse_id' not in session:
        return redirect('/')
    return render_template('chat.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

@app.route('/recover')
def recover():
    return render_template('recover.html')

@app.route('/api/recover', methods=['POST'])
def recover_id():
    data = request.json
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('SELECT warehouse_id FROM users WHERE phone = ? AND role = "boss"', (data['phone'],))
    result = c.fetchone()
    conn.close()
    if result:
        return jsonify({'success': True, 'warehouse_id': result[0]})
    return jsonify({'success': False}), 404

@app.route('/set_lang/<lang>')
def set_lang(lang):
    session['lang'] = lang
    return jsonify({'success': True})

@app.route('/api/send-code', methods=['POST'])
def send_code():
    data = request.json
    phone = data['phone']
    
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('SELECT COUNT(*) FROM users WHERE phone = ? AND role = "boss"', (phone,))
    if c.fetchone()[0] > 0:
        conn.close()
        return jsonify({'success': False, 'error': 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan'}), 400
    
    code = str(secrets.randbelow(9000) + 1000)
    date = datetime.now().strftime('%Y-%m-%d %H:%M')
    c.execute('INSERT INTO verification_codes (phone, code, created_at) VALUES (?, ?, ?)',
              (phone, code, date))
    conn.commit()
    conn.close()
    
    print(f'SMS CODE for {phone}: {code}')
    return jsonify({'success': True, 'message': f'Kod yuborildi (Console: {code})'})

@app.route('/api/verify-code', methods=['POST'])
def verify_code():
    data = request.json
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('SELECT id, code FROM verification_codes WHERE phone = ? AND verified = 0 ORDER BY id DESC LIMIT 1',
              (data['phone'],))
    result = c.fetchone()
    if result and result[1] == data['code']:
        c.execute('UPDATE verification_codes SET verified = 1 WHERE id = ?', (result[0],))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    conn.close()
    return jsonify({'success': False, 'error': 'Kod noto\'g\'ri'}), 400

@app.route('/api/create-warehouse', methods=['POST'])
def create_warehouse():
    data = request.json
    phone = data['phone']
    code = data['verification_code']
    
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    
    # Telegram bot orqali tasdiqlangan kodlarni tekshirish
    c.execute('''
        SELECT user_id FROM verification_codes 
        WHERE phone = ? AND code = ? 
        AND datetime(created_at) > datetime('now', '-10 minutes')
        ORDER BY created_at DESC LIMIT 1
    ''', (phone, code))
    
    verification = c.fetchone()
    if not verification:
        conn.close()
        return jsonify({'success': False, 'message': 'Tasdiqlash kodi noto\'g\'ri yoki muddati tugagan'}), 400
    
    # Telefon raqam allaqachon ro'yxatdan o'tganligini tekshirish
    c.execute('SELECT COUNT(*) FROM users WHERE phone = ? AND role = "boss"', (phone,))
    if c.fetchone()[0] > 0:
        conn.close()
        return jsonify({'success': False, 'message': 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan'}), 400
    
    warehouse_id = secrets.token_hex(8).upper()
    date = datetime.now().strftime('%Y-%m-%d %H:%M')
    expiry_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')  # 1 oy bepul
    
    c.execute('''INSERT INTO warehouses (id, name, created_date, subscription_type, subscription_expiry) 
                 VALUES (?, ?, ?, ?, ?)''',
              (warehouse_id, data['warehouse_name'], date, 'trial', expiry_date))
    c.execute('''INSERT INTO users (warehouse_id, username, phone, role, joined_date, subscription_type, subscription_expiry) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)''',
              (warehouse_id, data['username'], phone, 'boss', date, 'trial', expiry_date))
    
    # Verification kodini o'chirish
    c.execute('DELETE FROM verification_codes WHERE phone = ? AND code = ?', (phone, code))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'warehouse_id': warehouse_id})

@app.route('/api/join-warehouse', methods=['POST'])
def join_warehouse():
    data = request.json
    warehouse_id = data['warehouse_id'].upper()
    username = data['username']
    
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    
    # Sklad mavjudligini tekshirish
    c.execute('SELECT id, name FROM warehouses WHERE id = ?', (warehouse_id,))
    warehouse = c.fetchone()
    if not warehouse:
        conn.close()
        return jsonify({'success': False, 'message': 'Sklad topilmadi'}), 404
    
    # Foydalanuvchi allaqachon qo'shilganligini tekshirish
    c.execute('SELECT COUNT(*) FROM users WHERE warehouse_id = ? AND username = ?', 
              (warehouse_id, username))
    if c.fetchone()[0] > 0:
        conn.close()
        return jsonify({'success': False, 'message': 'Bu ism bilan foydalanuvchi allaqachon mavjud'}), 400
    
    date = datetime.now().strftime('%Y-%m-%d %H:%M')
    c.execute('INSERT INTO users (warehouse_id, username, phone, role, joined_date) VALUES (?, ?, ?, ?, ?)',
              (warehouse_id, username, None, 'worker', date))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Muvaffaqiyatli qo\'shildingiz!'})

@app.route('/api/user/info')
def user_info():
    if 'warehouse_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('SELECT phone FROM users WHERE id = ?', (session['user_id'],))
    phone = c.fetchone()[0] or '-'
    conn.close()
    return jsonify({
        'warehouse_id': session['warehouse_id'],
        'warehouse_name': session['warehouse_name'],
        'username': session['username'],
        'phone': phone,
        'role': session['role']
    })

@app.route('/api/users')
def get_users():
    if 'warehouse_id' not in session or session.get('role') not in ['boss', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('SELECT id, username, role, joined_date FROM users WHERE warehouse_id = ? ORDER BY id', 
              (session['warehouse_id'],))
    users = [{'id': row[0], 'username': row[1], 'role': row[2], 'joined_date': row[3]} for row in c.fetchall()]
    conn.close()
    return jsonify(users)

@app.route('/api/users/<int:user_id>/role', methods=['PUT'])
def update_user_role(user_id):
    if 'warehouse_id' not in session or session.get('role') != 'boss':
        return jsonify({'error': 'Access denied'}), 403
    data = request.json
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('UPDATE users SET role = ? WHERE id = ? AND warehouse_id = ?',
              (data['role'], user_id, session['warehouse_id']))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    if 'warehouse_id' not in session or session.get('role') not in ['boss', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    if user_id == session.get('user_id'):
        return jsonify({'error': 'Cannot delete yourself'}), 400
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('DELETE FROM users WHERE id = ? AND warehouse_id = ?', (user_id, session['warehouse_id']))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/products', methods=['GET'])
def get_products():
    if 'warehouse_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('SELECT id, name, model, box_quantity, items_per_box, quantity, buy_price, image_path, date_added FROM products WHERE warehouse_id = ? ORDER BY id DESC', (session['warehouse_id'],))
    products = [{
        'id': row[0], 
        'name': row[1], 
        'model': row[2],
        'box_quantity': row[3],
        'items_per_box': row[4],
        'quantity': row[5], 
        'price': row[6], 
        'image': row[7],
        'date': row[8]
    } for row in c.fetchall()]
    conn.close()
    return jsonify(products)

@app.route('/api/products', methods=['POST'])
def add_product():
    if 'warehouse_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    from werkzeug.utils import secure_filename
    import os
    
    name = request.form.get('name')
    model = request.form.get('model') or None
    box_qty = int(request.form.get('box_quantity', 1))
    items_per_box = int(request.form.get('items_per_box', 1))
    buy_price = float(request.form.get('buy_price', 0))
    
    image_path = None
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename:
            filename = secure_filename(f"{session['warehouse_id']}_{datetime.now().timestamp()}_{file.filename}")
            filepath = os.path.join('static', 'uploads', filename)
            file.save(filepath)
            image_path = f'/static/uploads/{filename}'
    
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    date = datetime.now().strftime('%Y-%m-%d %H:%M')
    
    total_items = box_qty * items_per_box
    
    c.execute('SELECT id, quantity FROM products WHERE warehouse_id = ? AND name = ? AND COALESCE(model, "") = COALESCE(?, "") AND items_per_box = ?', 
              (session['warehouse_id'], name, model, items_per_box))
    existing = c.fetchone()
    
    if existing:
        new_qty = existing[1] + total_items
        c.execute('UPDATE products SET quantity = ?, date_added = ? WHERE id = ?',
                  (new_qty, date, existing[0]))
    else:
        c.execute('''INSERT INTO products (warehouse_id, name, model, box_quantity, items_per_box, quantity, buy_price, image_path, date_added) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (session['warehouse_id'], name, model, box_qty, items_per_box, total_items, buy_price, image_path, date))
    
    c.execute('INSERT INTO transactions (warehouse_id, product_name, quantity, price, type, date) VALUES (?, ?, ?, ?, ?, ?)',
              (session['warehouse_id'], name, total_items, buy_price, 'in', date))
    
    # Add system log to chat
    log_msg = f"📦 Tovar qo'shildi: {name} - {total_items} dona"
    c.execute('INSERT INTO messages (warehouse_id, user_id, username, message, created_date) VALUES (?, ?, ?, ?, ?)',
              (session['warehouse_id'], 0, 'SYSTEM', log_msg, date))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/products/remove', methods=['POST'])
def remove_product():
    if 'warehouse_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    data = request.json
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('SELECT name, quantity FROM products WHERE warehouse_id = ? AND id = ?', 
              (session['warehouse_id'], data['product_id']))
    product = c.fetchone()
    if not product:
        conn.close()
        return jsonify({'success': False, 'error': 'Tovar topilmadi'}), 404
    
    remove_qty = data['quantity']
    if remove_qty > product[1]:
        conn.close()
        return jsonify({'success': False, 'error': 'Yetarli miqdor yo\'q'}), 400
    
    date = datetime.now().strftime('%Y-%m-%d %H:%M')
    new_qty = product[1] - remove_qty
    sell_price = data['sell_price']
    
    if new_qty == 0:
        c.execute('DELETE FROM products WHERE id = ?', (data['product_id'],))
    else:
        c.execute('UPDATE products SET quantity = ? WHERE id = ?', (new_qty, data['product_id']))
    
    c.execute('INSERT INTO transactions (warehouse_id, product_name, quantity, price, type, date) VALUES (?, ?, ?, ?, ?, ?)',
              (session['warehouse_id'], product[0], remove_qty, sell_price, 'out', date))
    
    # Add system log to chat
    log_msg = f"📤 Tovar chiqarildi: {product[0]} - {remove_qty} dona"
    c.execute('INSERT INTO messages (warehouse_id, user_id, username, message, created_date) VALUES (?, ?, ?, ?, ?)',
              (session['warehouse_id'], 0, 'SYSTEM', log_msg, date))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/stats')
def get_stats():
    if 'warehouse_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('SELECT SUM(quantity) FROM products WHERE warehouse_id = ?', (session['warehouse_id'],))
    total_quantity = c.fetchone()[0] or 0
    c.execute('SELECT SUM(quantity * buy_price) FROM products WHERE warehouse_id = ?', (session['warehouse_id'],))
    total_value = c.fetchone()[0] or 0
    c.execute("SELECT SUM(quantity * price) FROM transactions WHERE warehouse_id = ? AND type='in' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')",
              (session['warehouse_id'],))
    monthly_in = c.fetchone()[0] or 0
    c.execute("SELECT SUM(quantity * price) FROM transactions WHERE warehouse_id = ? AND type='out' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')",
              (session['warehouse_id'],))
    monthly_out = c.fetchone()[0] or 0
    c.execute('SELECT SUM(debt_amount) FROM orders WHERE warehouse_id = ? AND status = "active"', (session['warehouse_id'],))
    total_debt = c.fetchone()[0] or 0
    conn.close()
    return jsonify({
        'total_quantity': total_quantity,
        'total_value': round(total_value, 2),
        'monthly_in': round(monthly_in, 2),
        'monthly_out': round(monthly_out, 2),
        'total_debt': round(total_debt, 2)
    })

# Warehouse Settings API
@app.route('/api/settings', methods=['GET'])
def get_settings():
    if 'warehouse_id' not in session or session.get('role') != 'boss':
        return jsonify({'error': 'Access denied'}), 403
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('SELECT enable_images, enable_orders, enable_statistics, enable_chat FROM warehouses WHERE id = ?', (session['warehouse_id'],))
    settings = c.fetchone()
    conn.close()
    return jsonify({
        'enable_images': settings[0] if settings else 0,
        'enable_orders': settings[1] if settings else 0,
        'enable_statistics': settings[2] if settings else 0,
        'enable_chat': settings[3] if settings else 0
    })

@app.route('/api/settings-public', methods=['GET'])
def get_settings_public():
    if 'warehouse_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('SELECT enable_images, enable_orders, enable_statistics, enable_chat FROM warehouses WHERE id = ?', (session['warehouse_id'],))
    settings = c.fetchone()
    conn.close()
    return jsonify({
        'enable_images': settings[0] if settings else 0,
        'enable_orders': settings[1] if settings else 0,
        'enable_statistics': settings[2] if settings else 0,
        'enable_chat': settings[3] if settings else 0
    })

@app.route('/api/settings', methods=['POST'])
def update_settings():
    if 'warehouse_id' not in session or session.get('role') != 'boss':
        return jsonify({'error': 'Access denied'}), 403
    data = request.json
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('''UPDATE warehouses SET enable_images = ?, enable_orders = ?, enable_statistics = ?, enable_chat = ? 
                 WHERE id = ?''',
              (data.get('enable_images', 0), data.get('enable_orders', 0), 
               data.get('enable_statistics', 0), data.get('enable_chat', 0), session['warehouse_id']))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# Chat API
@app.route('/api/messages', methods=['GET'])
def get_messages():
    if 'warehouse_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('''SELECT m.id, m.username, m.message, m.created_date, u.role 
                 FROM messages m 
                 LEFT JOIN users u ON m.user_id = u.id 
                 WHERE m.warehouse_id = ? ORDER BY m.id DESC LIMIT 100''', (session['warehouse_id'],))
    messages = [{'id': r[0], 'username': r[1], 'message': r[2], 'date': r[3], 'is_boss': r[4] == 'boss' if r[4] else False} for r in c.fetchall()]
    conn.close()
    return jsonify(messages[::-1])  # Reverse to show oldest first

@app.route('/api/messages', methods=['POST'])
def send_message():
    if 'warehouse_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    data = request.json
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    date = datetime.now().strftime('%Y-%m-%d %H:%M')
    c.execute('INSERT INTO messages (warehouse_id, user_id, username, message, created_date) VALUES (?, ?, ?, ?, ?)',
              (session['warehouse_id'], session['user_id'], session['username'], data['message'], date))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# Debts API
@app.route('/api/debts', methods=['GET'])
def get_debts():
    if 'warehouse_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('SELECT * FROM debts WHERE warehouse_id = ? AND paid = 0 ORDER BY id DESC', (session['warehouse_id'],))
    debts = [{'id': r[0], 'type': r[2], 'person': r[3], 'amount': r[4], 'date': r[5]} for r in c.fetchall()]
    conn.close()
    return jsonify(debts)

@app.route('/api/debts', methods=['POST'])
def add_debt():
    if 'warehouse_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    data = request.json
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    date = datetime.now().strftime('%Y-%m-%d %H:%M')
    c.execute('INSERT INTO debts (warehouse_id, debt_type, person_name, amount, created_date) VALUES (?, ?, ?, ?, ?)',
              (session['warehouse_id'], data['type'], data['person'], data['amount'], date))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/debts/<int:debt_id>', methods=['DELETE'])
def delete_debt(debt_id):
    if 'warehouse_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('UPDATE debts SET paid = 1 WHERE id = ? AND warehouse_id = ?', (debt_id, session['warehouse_id']))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# Orders API
@app.route('/api/orders', methods=['GET'])
def get_orders():
    if 'warehouse_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('''SELECT id, created_date, note, status FROM orders 
                 WHERE warehouse_id = ? AND status = 'active' ORDER BY id DESC''', (session['warehouse_id'],))
    orders = []
    for row in c.fetchall():
        order_id = row[0]
        c.execute('SELECT product_name, model, box_quantity, items_per_box, sell_price FROM order_items WHERE order_id = ?', (order_id,))
        items = [{'name': i[0], 'model': i[1], 'boxes': i[2], 'items': i[3], 'price': i[4]} for i in c.fetchall()]
        orders.append({'id': order_id, 'date': row[1], 'note': row[2], 'items': items})
    conn.close()
    return jsonify(orders)

@app.route('/api/orders', methods=['POST'])
def create_order():
    if 'warehouse_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    data = request.json
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    date = datetime.now().strftime('%Y-%m-%d %H:%M')
    
    c.execute('INSERT INTO orders (warehouse_id, created_date, note) VALUES (?, ?, ?)',
              (session['warehouse_id'], date, data.get('note')))
    order_id = c.lastrowid
    
    for item in data['items']:
        c.execute('INSERT INTO order_items (order_id, product_name, model, box_quantity, items_per_box, sell_price, from_stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  (order_id, item['name'], item.get('model'), item['boxes'], item['items'], item['price'], item.get('from_stock', 0)))
        
        if item.get('from_stock'):
            c.execute('SELECT id, quantity FROM products WHERE warehouse_id = ? AND name = ?', (session['warehouse_id'], item['name']))
            product = c.fetchone()
            if product:
                total_items = item['boxes'] * item['items']
                new_qty = product[1] - total_items
                if new_qty <= 0:
                    c.execute('DELETE FROM products WHERE id = ?', (product[0],))
                else:
                    c.execute('UPDATE products SET quantity = ? WHERE id = ?', (new_qty, product[0]))
                c.execute('INSERT INTO transactions (warehouse_id, product_name, quantity, price, type, date) VALUES (?, ?, ?, ?, ?, ?)',
                          (session['warehouse_id'], item['name'], total_items, item['price'], 'out', date))
    
    # Add system log to chat
    log_msg = f"📦 Yangi zakaz yaratildi #{order_id}"
    c.execute('INSERT INTO messages (warehouse_id, user_id, username, message, created_date) VALUES (?, ?, ?, ?, ?)',
              (session['warehouse_id'], 0, 'SYSTEM', log_msg, date))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'order_id': order_id})

@app.route('/api/orders/<int:order_id>/deliver', methods=['POST'])
def deliver_order(order_id):
    if 'warehouse_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    date = datetime.now().strftime('%Y-%m-%d %H:%M')
    c.execute('UPDATE orders SET status = "delivered", delivered_date = ? WHERE id = ? AND warehouse_id = ?',
              (date, order_id, session['warehouse_id']))
    
    # Add system log to chat
    log_msg = f"✅ Zakaz yetkazildi #{order_id}"
    c.execute('INSERT INTO messages (warehouse_id, user_id, username, message, created_date) VALUES (?, ?, ?, ?, ?)',
              (session['warehouse_id'], 0, 'SYSTEM', log_msg, date))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# Theme API
@app.route('/api/theme', methods=['GET'])
def get_theme():
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('SELECT theme FROM global_settings WHERE id = 1')
    theme = c.fetchone()
    conn.close()
    return jsonify({'theme': theme[0] if theme else 'ordinary'})

@app.route('/api/theme', methods=['POST'])
def update_theme():
    if session.get('admin') != True:
        return jsonify({'error': 'Access denied'}), 403
    data = request.json
    theme = data.get('theme', 'ordinary')
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('UPDATE global_settings SET theme = ? WHERE id = 1', (theme,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# Background API
@app.route('/api/background', methods=['GET'])
def get_background():
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('SELECT background_image FROM global_settings WHERE id = 1')
    bg = c.fetchone()
    conn.close()
    return jsonify({'background': bg[0] if bg and bg[0] else None})

@app.route('/api/background', methods=['POST'])
def upload_background():
    if session.get('admin') != True:
        return jsonify({'error': 'Access denied'}), 403
    
    if 'background' not in request.files:
        return jsonify({'error': 'No file'}), 400
    
    file = request.files['background']
    if file and file.filename:
        filename = secure_filename(f"bg_{datetime.now().timestamp()}_{file.filename}")
        filepath = os.path.join('static', 'uploads', filename)
        file.save(filepath)
        bg_path = f'/static/uploads/{filename}'
        
        conn = sqlite3.connect('erax.db')
        c = conn.cursor()
        c.execute('UPDATE global_settings SET background_image = ? WHERE id = 1', (bg_path,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'background': bg_path})
    
    return jsonify({'error': 'Invalid file'}), 400

@app.route('/api/background', methods=['DELETE'])
def remove_background():
    if session.get('admin') != True:
        return jsonify({'error': 'Access denied'}), 403
    
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('UPDATE global_settings SET background_image = NULL WHERE id = 1')
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

# Admin Panel Routes
@app.route('/admin')
def admin_panel():
    if session.get('admin') != True:
        return redirect('/admin/login')
    return render_template('admin.html')

@app.route('/admin/themes')
def admin_themes():
    if session.get('admin') != True:
        return redirect('/admin/login')
    return render_template('admin_themes.html')

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        password = data.get('password')
        if password == 'admin123':  # Oddiy parol
            session['admin'] = True
            if request.is_json:
                return jsonify({'success': True})
            return redirect('/admin')
        else:
            if request.is_json:
                return jsonify({'success': False, 'error': 'Noto\'g\'ri parol'})
            return render_template('admin_login.html', error='Noto\'g\'ri parol')
    return render_template('admin_login.html')

@app.route('/api/admin/stats')
def admin_stats():
    if session.get('admin') != True:
        return jsonify({'error': 'Access denied'}), 403
    
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    
    # Jami skladlar
    c.execute('SELECT COUNT(*) FROM warehouses')
    warehouses = c.fetchone()[0]
    
    # Jami foydalanuvchilar
    c.execute('SELECT COUNT(*) FROM users')
    users = c.fetchone()[0]
    
    # Faol obunalar
    c.execute("SELECT COUNT(*) FROM users WHERE subscription_type != 'trial' AND subscription_expiry > date('now')")
    subscriptions = c.fetchone()[0]
    
    # Oylik daromad (hisoblash)
    revenue = subscriptions * 35000  # O'rtacha
    
    conn.close()
    
    return jsonify({
        'success': True,
        'stats': {
            'warehouses': warehouses,
            'users': users,
            'subscriptions': subscriptions,
            'revenue': revenue
        }
    })

@app.route('/api/admin/search-user', methods=['POST'])
def admin_search_user():
    if session.get('admin') != True:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.json
    phone = data.get('phone')
    
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('''SELECT id, warehouse_id, username, phone, role, subscription_type, subscription_expiry 
                 FROM users WHERE phone = ? AND role IN ('boss', 'admin')''', (phone,))
    user = c.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'success': True,
            'user': {
                'id': user[0],
                'warehouse_id': user[1],
                'username': user[2],
                'phone': user[3],
                'role': user[4],
                'subscription_type': user[5] or 'trial',
                'subscription_expiry': user[6]
            }
        })
    else:
        return jsonify({'success': False, 'message': 'Foydalanuvchi topilmadi'})

@app.route('/api/admin/update-subscription', methods=['POST'])
def admin_update_subscription():
    if session.get('admin') != True:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.json
    user_id = data.get('user_id')
    subscription_type = data.get('subscription_type')
    expiry_date = data.get('expiry_date')
    
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('''UPDATE users SET subscription_type = ?, subscription_expiry = ? 
                 WHERE id = ?''', (subscription_type, expiry_date, user_id))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/admin/all-users')
def admin_all_users():
    if session.get('admin') != True:
        return jsonify({'error': 'Access denied'}), 403
    
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('''SELECT id, warehouse_id, username, phone, role, subscription_type, subscription_expiry 
                 FROM users ORDER BY id DESC LIMIT 100''')
    users = []
    for row in c.fetchall():
        users.append({
            'id': row[0],
            'warehouse_id': row[1],
            'username': row[2],
            'phone': row[3],
            'role': row[4],
            'subscription_type': row[5] or 'trial',
            'subscription_expiry': row[6]
        })
    conn.close()
    
    return jsonify({'success': True, 'users': users})

@app.route('/api/admin/all-warehouses')
def admin_all_warehouses():
    if session.get('admin') != True:
        return jsonify({'error': 'Access denied'}), 403
    
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    c.execute('''SELECT w.id, w.name, w.created_date, w.subscription_type, 
                 (SELECT COUNT(*) FROM users WHERE warehouse_id = w.id) as user_count
                 FROM warehouses w ORDER BY w.created_date DESC LIMIT 100''')
    warehouses = []
    for row in c.fetchall():
        warehouses.append({
            'id': row[0],
            'name': row[1],
            'created_date': row[2],
            'subscription_type': row[3] or 'trial',
            'user_count': row[4]
        })
    conn.close()
    
    return jsonify({'success': True, 'warehouses': warehouses})

@app.route('/api/admin/subscriptions')
def admin_subscriptions():
    if session.get('admin') != True:
        return jsonify({'error': 'Access denied'}), 403
    
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    
    # Obuna turlari bo'yicha statistika
    c.execute("SELECT subscription_type, COUNT(*) FROM users WHERE role IN ('boss', 'admin') GROUP BY subscription_type")
    subscription_stats = {}
    for row in c.fetchall():
        sub_type = row[0] or 'trial'
        subscription_stats[sub_type] = row[1]
    
    conn.close()
    
    return jsonify({
        'success': True,
        'subscriptions': {
            'trial': subscription_stats.get('trial', 0),
            'basic': subscription_stats.get('basic', 0),
            'pro': subscription_stats.get('pro', 0),
            'premium': subscription_stats.get('premium', 0)
        }
    })

@app.route('/api/admin/send-message', methods=['POST'])
def admin_send_message():
    if session.get('admin') != True:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.json
    message_type = data.get('type')
    message_text = data.get('message')
    warehouse_id = data.get('warehouse_id')
    
    conn = sqlite3.connect('erax.db')
    c = conn.cursor()
    date = datetime.now().strftime('%Y-%m-%d %H:%M')
    
    if message_type == 'all':
        c.execute('SELECT id FROM warehouses')
        warehouses = c.fetchall()
        for wh in warehouses:
            c.execute('INSERT INTO messages (warehouse_id, user_id, username, message, created_date) VALUES (?, ?, ?, ?, ?)',
                      (wh[0], 0, 'SYSTEM', f'📢 Admin: {message_text}', date))
    else:
        c.execute('SELECT id FROM warehouses WHERE id = ?', (warehouse_id,))
        if c.fetchone():
            c.execute('INSERT INTO messages (warehouse_id, user_id, username, message, created_date) VALUES (?, ?, ?, ?, ?)',
                      (warehouse_id, 0, 'SYSTEM', f'📢 Admin: {message_text}', date))
        else:
            conn.close()
            return jsonify({'success': False, 'message': 'Sklad topilmadi'})
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

def start_bot():
    try:
        subprocess.Popen(['python', 'bot.py'], cwd=os.getcwd())
        print("Bot ishga tushirildi")
    except Exception as e:
        print(f"Bot ishga tushmadi: {e}")

if __name__ == '__main__':
    init_db()
    
    # Botni alohida thread da ishga tushirish
    bot_thread = threading.Thread(target=start_bot)
    bot_thread.daemon = True
    bot_thread.start()
    
    print("Sayt ishga tushdi: http://127.0.0.1:5000")
    app.run(debug=True, use_reloader=False)
