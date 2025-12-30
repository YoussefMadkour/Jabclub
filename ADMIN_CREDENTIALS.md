# 🔐 Admin & Coach Credentials

## Production Credentials

**⚠️ IMPORTANT: Keep these credentials secure and private!**

### Admin Account
- **Email**: `admin@jabclub.com`
- **Password**: `GG$jPJ80zpEs6GcA4!cO`

### Coach Account
- **Email**: `coach@jabclub.com`
- **Password**: `avpRDt%$5Cw$3FdmJS97`

## 📝 Notes

- These passwords are randomly generated and secure (20 characters with mixed case, numbers, and special characters)
- Credentials are also saved in `.admin-credentials.json` (not committed to git)
- **Change these passwords immediately** after first login in production
- Never share these credentials publicly

## 🔄 Updating Passwords

To generate new secure passwords:

```bash
cd backend
export $(cat .env.local | grep DATABASE_URL | xargs)
npm run update-passwords
```

This will:
- Generate new secure passwords (20 characters)
- Update the database
- Save credentials to `.admin-credentials.json`
- Display the new passwords (save them immediately!)

## 🚨 Security Best Practices

1. **Change passwords after first login**
2. **Use strong, unique passwords** (the script generates secure ones)
3. **Never commit credentials** to git
4. **Use environment variables** for sensitive data
5. **Enable 2FA** if available in your application
6. **Rotate passwords regularly**

## 📧 Member Account

The member account still uses the default password:
- **Email**: `member@jabclub.com`
- **Password**: `member123`

**Note**: Members can change their own passwords after logging in.

