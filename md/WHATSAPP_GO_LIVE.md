# WhatsApp Integration V1 — Go-Live Checklist

**Date:** 2026-06-16
**Status:** Ready for deployment after Meta API setup

---

## Pre-Deployment

### 1. Meta Business Manager Setup
- [ ] Create Meta App at developers.facebook.com
- [ ] Add WhatsApp product to the app
- [ ] Generate permanent access token (not temporary)
- [ ] Register WhatsApp Business phone number
- [ ] Note down: Phone Number ID, Business Account ID, Access Token

### 2. Webhook Configuration
- [ ] Set webhook URL: `https://mimotes.ekohomelab.online/api/whatsapp/webhook`
- [ ] Set verify token (match with Mimotes config)
- [ ] Subscribe to webhook fields: `messages`, `message_deliveries`, `message_reads`
- [ ] Verify webhook passes Meta's challenge test

### 3. Environment Variables
Add to `.env`:
```env
WHATSAPP_APP_SECRET=<your_meta_app_secret>
WHATSAPP_VERIFY_TOKEN=<your_custom_verify_token>
```

### 4. Database Migration
```bash
# Apply schema changes
npx prisma db push

# Apply RLS policies
docker exec -i mimotes-db-1 psql -U mimotes -d mimotes < prisma/migrations/006_add_whatsapp.sql

# Fix table ownership
docker exec mimotes-db-1 psql -U mimotes -d mimotes -c "
DO \$\$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tableowner != 'mimotes_app' LOOP
    EXECUTE format('ALTER TABLE %I OWNER TO mimotes_app', r.tablename);
  END LOOP;
END \$\$;"

# Grant permissions
docker exec mimotes-db-1 psql -U mimotes -d mimotes -c "
GRANT ALL ON ALL TABLES IN SCHEMA public TO mimotes_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO mimotes_app;"
```

### 5. Application Configuration
- [ ] Login to Mimotes dashboard
- [ ] Go to Settings → WhatsApp
- [ ] Enter Phone Number ID
- [ ] Enter Access Token
- [ ] Enter Verify Token
- [ ] Click "Simpan Konfigurasi"
- [ ] Click "Test Koneksi" — verify phone info returned
- [ ] Enable auto-reply (optional)
- [ ] Set welcome message (optional)
- [ ] Set offline message (optional)

### 6. Build & Deploy
```bash
# Build
npm run build

# Restart container
docker stop mimotes-app-1 && docker rm mimotes-app-1
docker compose create app && docker compose start app
```

---

## Post-Deployment Verification

### 7. Smoke Tests
- [ ] Send "Halo" to WhatsApp number → AI responds
- [ ] Send "Berapa harga?" → Lead intent detected as "harga"
- [ ] Send image → AI acknowledges receipt
- [ ] Check Settings → WhatsApp → Connection status shows "Terhubung"
- [ ] Check WhatsApp dashboard → Conversation appears
- [ ] Check conversation detail → Messages displayed correctly
- [ ] Send manual reply from dashboard → Message delivered
- [ ] Check analytics → "whatsapp_chat" event recorded
- [ ] Check audit log → "whatsapp.message_received" action logged

### 8. Security Verification
- [ ] Webhook rejects invalid signatures (401)
- [ ] Access token not exposed in API responses
- [ ] Free plan user gets 403 when configuring WhatsApp
- [ ] Workspace A cannot see Workspace B conversations
- [ ] Rate limiting active (60 req/min per key)

### 9. Monitoring
- [ ] Check container logs: `docker logs mimotes-app-1 --tail 50`
- [ ] No "[WhatsApp] Failed" errors in logs
- [ ] Health endpoint: `GET /api/health` → all green
- [ ] Meta Business Manager → WhatsApp → Delivery rates normal

---

## Rollback Plan

If WhatsApp integration causes issues:

1. **Disable auto-reply:** Settings → WhatsApp → Toggle off "Balasan Otomatis"
2. **Disable integration:** Settings → WhatsApp → Toggle off "isEnabled"
3. **Remove webhook:** Meta Business Manager → Webhooks → Remove URL
4. **Delete config:** Settings → WhatsApp → "Hapus Konfigurasi"
5. **Revert code:** `git revert HEAD` + rebuild

---

## Known Limitations (V1)

| Limitation | Impact | Workaround |
|-----------|--------|------------|
| Text/image/document only | Audio/video/sticker ignored | Future: add media processing |
| No template messages | Can't send pre-approved templates | Use auto-reply instead |
| No group messages | Only 1:1 conversations | Future: group support |
| No media in responses | AI only sends text | Future: send images/docs |
| In-memory rate limiting | Lost on restart | Future: Redis-backed |
| No conversation assignment | Can't assign to team member | Future: assignment workflow |
| No conversation notes | Can't add internal notes | Future: notes feature |

---

## Support

- **Meta API Docs:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **Webhook Reference:** https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
- **Rate Limits:** https://developers.facebook.com/docs/whatsapp/cloud-api/overview#rate-limits
- **Mimotes Dashboard:** https://mimotes.ekohomelab.online

---

*Go-live checklist by Hermes Agent — Deploy after Meta API setup.*
