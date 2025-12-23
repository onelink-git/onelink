# 🔐 OneLink Authentication System

**Login / Password / 2FA / Identity**

---
## 1️⃣ Основна философия (преди техниката)

### 🎯 Цел
Да позволим **сигурен вход**, без:
- задължителен email
- събиране на излишни лични данни
- сложни UX потоци
### Основни принципи
- Nickname = публична идентичност
- Auth ≠ Identity (автентикацията е техническа, профилът е социален)
- Всичко чувствително се валидира **server-side**
- Потребителят **притежава** достъпа си и може да го възстанови
---
## 2️⃣ Видове акаунти (много важно)

OneLink поддържа **3 нива на идентичност**:
### Level 1 — Minimal (MVP default)
- Nickname
- Password
- UID (вътрешен, Firebase)
👉 Няма email, няма телефон
### Level 2 — Recoverable
- Nickname
- Password
- Optional email (само за recovery)
- 2FA (TOTP)
### Level 3 — Strong Identity (future)
- Passkeys (WebAuthn)
- Hardware-backed security
- Device trust
---
## 3️⃣ Регистрация (Sign Up) — детайлно
### Стъпка 1: Избор на Nickname
Изисквания:
- уникален
- lowercase normalized
- regex: `^[a-z0-9_]{3,20}$`
Flow:
1. Client → `/api/check-nickname`
2. Server:
    - нормализира
    - проверява Firestore
3. Response:
    - available / taken
👉 Никога не разчитаме на client validation само.
---
### Стъпка 2: Парола
**Правила:**
- min 10 символа
- 1 letter
- 1 number
- 1 special
❗ Паролата **никога** не се:
- логва
- пази в plaintext
- обработва извън Firebase Auth
---
### Стъпка 3: Account creation
**Backend flow:**
1. Client:
    - nickname
    - password
2. Server:
    - създава Firebase Auth user
    - получава `uid`
3. Firestore:
    - `/users/{uid}`
    - `/profiles/{nickname}`

```jsonc
{
  "uid": "firebase_uid",
  "nickname": "bobsby23",
  "createdAt": "...",
  "authLevel": 1,
  "recovery": {
    "email": null,
    "2fa": false
  }
}
```
---
## 4️⃣ Login (Sign In) — детайлно
### Стандартен вход
**Входни данни:**
- nickname
- password
### Flow:
1. Client:
    - превръща nickname → email-like internal mapping  
        (напр. `nickname@onelink.internal`)
2. Firebase Auth:
    - проверява password
3. Client получава:
    - ID Token
4. Server:
    - валидира token с Admin SDK
    - създава secure session
👉 Никога не се доверяваме на client само.
---
## 5️⃣ Session Management
### Token модел
- Firebase ID Token (short-lived)
- Refresh Token (managed by Firebase)
- Optional HTTP-only session cookie (SSR)
Предимства:
- SSR compatible
- защита от XSS
- silent refresh
---
## 6️⃣ 2FA (Two-Factor Authentication)
### Поддържан тип: **TOTP (RFC 6238)**
📱 Google Authenticator, Authy, 1Password
### Активиране:
1. User → Settings → Security
2. Server:
    - генерира TOTP secret
    - връща QR code
3. User:
    - сканира
    - въвежда първи код
4. Server:
    - валидира
    - активира 2FA
```jsonc
"2fa": {
  "enabled": true,
  "method": "totp",
  "enrolledAt": "..."
}
```
---
### Login с 2FA
1. Nickname + password
2. Ако 2FA active:
    - require TOTP code
3. Server validation
4. Issue session
❗ Без валиден TOTP → няма login
---
## 7️⃣ Password Reset / Account Recovery
### Recovery опции

| Метод          | Статус      |
| -------------- | ----------- |
| Email recovery | optional    |
| Recovery codes | recommended |
| Manual support | last resort |
### Recovery codes
- 8–10 еднократни кода
- hash-нати в DB
- regenerate при използване
---
## 8️⃣ Security Measures (важната част)
### Rate limiting
- login attempts / IP
- nickname lookup
### Abuse prevention
- captcha при съмнение
- lockout след N неуспешни опита
### Server-side validation
- ВСИЧКО важно минава през Admin SDK
---
## 9️⃣ Firestore Security Rules (Auth-aware)
```js
match /users/{uid} {
  allow read: if request.auth.uid == uid;
  allow write: if request.auth.uid == uid;
}
```
Profiles:
```js
match /profiles/{nickname} {
  allow read: if true;
  allow write: if request.auth.uid == resource.data.uid;
}
```
---
## 🔮 Future Auth Upgrades (planned)
- Passkeys (WebAuthn)
- Device trust
- Login approval flows
- Account activity logs
- Per-device sessions
---
## 🧠 UX решения (много важно)
- Ясни съобщения без издаване на информация  
    ❌ „Wrong password“  
    ✅ „Invalid credentials“
- Progressive security:
    - прост вход → силна защита по избор
- Всичко security-related е:
    - ясно
    - обяснено
    - reversible
---
## 🧩 MVP Checklist
-  Nickname + password auth    
-  Firebase Auth integration
-  Secure session handling
-  Firestore user/profile mapping
-  2FA (TOTP)
-  Recovery codes
-  Passkeys (later)
---
## Следващи стъпки
1. Да го превърнем в **Auth Design Doc (MD)**
2. Да напиша **exact API routes** (`/api/auth/*`)
3. Да генерирам **UX wireframes за Login / Register**
4. Да подготвя **Gemini/GPT prompt само за Auth**