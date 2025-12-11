# Erax Sklad - Omborxona Boshqaruv Tizimi

## O'rnatish

1. Virtual environment yarating:
```bash
python -m venv venv
venv\Scripts\activate
```

2. Kerakli kutubxonalarni o'rnating:
```bash
pip install -r requirements.txt
```

3. Ilovani ishga tushiring:
```bash
python app.py
```

4. Telegram botni ishga tushiring (ixtiyoriy):
```bash
python telegram_bot.py
```

5. Brauzerda oching: http://127.0.0.1:5000

## Funksiyalar

### Asosiy funksiyalar
- ✅ Tovarlar qo'shish va o'chirish
- ✅ Omborxona statistikasi
- ✅ Oylik kirim/chiqim hisoboti
- ✅ Rus va O'zbek tillari
- ✅ Oddiy va tushunarli dizayn

### Yangi qo'shilgan funksiyalar
- ✅ Qidiruv va filtrlash
- ✅ Sahifalash (Pagination)
- ✅ Excel ga export
- ✅ Ma'lumotlar backup
- ✅ Tungi rejim (Dark mode)
- ✅ Toast xabarlari
- ✅ Loading animatsiyalari
- ✅ Responsive dizayn
- ✅ Print uchun optimizatsiya
- ✅ Clipboard ga nusxalash
- ✅ Form validatsiyasi
- ✅ Telegram bot integratsiyasi
- ✅ Telefon raqam tasdiqlash
- ✅ Support tizimi
- ✅ Sklad ID olish

## Telegram Bot

### Bot funksiyalari
- 📱 **Telefon tasdiqlash**: Sklad yaratishda telefon raqamni tasdiqlash
- 📞 **Support tizimi**: Savol, murojaat, reklama uchun admin bilan bog'lanish
- 🆔 **Sklad ID olish**: Telefon raqamga ulangan sklad ID ni olish

### Bot o'rnatish
1. `bot_setup.md` faylini o'qing
2. @BotFather dan bot yarating
3. Token ni `telegram_bot.py` ga kiriting
4. Bot kutubxonalarini o'rnating: `pip install -r bot_requirements.txt`
5. Bot ishga tushiring: `python telegram_bot.py`

### Registration jarayoni
1. **Mavjud skladga qo'shilish**: Sklad ID, ism va telefon raqam bilan
2. **Yangi sklad yaratish**: 
   - Sklad nomi, ism va telefon raqam kiritish
   - Telegram botga o'tish
   - Telefon raqamni tasdiqlash
   - Tasdiqlash kodini saytga kiritish
   - Sklad yaratish va ID olish
