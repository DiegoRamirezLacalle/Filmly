# CORS & Proxy Configuration

## Overview
Filmly uses a Gateway pattern where:
- **Browser** ↔ **Gateway** (CORS enabled)
- **Gateway** ↔ **Internal APIs** (no CORS needed)

## Current Setup

### ✅ Gateway (Port 8080)
```typescript
// gateway/src/index.ts
app.use(cors()); // Allows all origins (dev mode)
```

**Routes:**
- `/health` → Gateway health
- `/api/users/*` → api-users:5001
- `/api/movies/*` → api-catalog:5000
- `/api/reviews/*` → api-catalog:5000/reviews
- `/api/mylist/*` → api-catalog:5000/mylist

### 🔧 Internal Services

#### api-catalog (Port 5000)
```typescript
// api-catalog/src/index.ts
app.use(cors()); // ⚠️ Not needed in production behind gateway
```

#### api-users (Port 5001)
```python
# No CORS middleware - ✅ Correct for internal service
```

## Security Considerations

### Development vs Production

#### Development (Current)
- **Gateway CORS**: `cors()` allows all origins
- **Internal CORS**: api-catalog has CORS (redundant but harmless)
- **Access**: Services can be accessed directly for debugging

#### Production (Recommended)
```typescript
// gateway/src/index.ts
const allowedOrigins = [
  "https://filmly.com",
  "https://www.filmly.com",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
```

**Changes needed:**
1. ❌ **Remove CORS from api-catalog** (not exposed to browser)
2. ❌ **Remove CORS from api-users** (already done)
3. ✅ **Restrict Gateway CORS** to allowed domains only
4. 🔒 **Firewall**: Block direct access to ports 5000, 5001 from internet

## Network Topology

```
Browser (localhost:3000)
    ↓ (HTTP with CORS)
Gateway (localhost:8080)
    ↓ (Internal network, no CORS needed)
    ├─→ api-users (localhost:5001)
    └─→ api-catalog (localhost:5000)
            ↓
        MongoDB, Elasticsearch
```

## Production Checklist

### Gateway
- [ ] Set specific CORS origins (not wildcard)
- [ ] Enable `credentials: true` if using cookies
- [ ] Add rate limiting
- [ ] Enable HTTPS/TLS
- [ ] Add request logging

### Internal Services
- [ ] Remove CORS middleware from api-catalog
- [ ] Ensure services only listen on internal network
- [ ] Add firewall rules to block external access
- [ ] Use Docker network isolation

### Docker Compose Production
```yaml
services:
  gateway:
    ports:
      - "8080:8080"  # ✅ Exposed to host
    environment:
      - ALLOWED_ORIGINS=https://filmly.com,https://www.filmly.com
  
  api-users:
    # ❌ No ports exposed to host
    networks:
      - internal
  
  api-catalog:
    # ❌ No ports exposed to host
    networks:
      - internal

networks:
  internal:
    driver: bridge
```

## Testing CORS

### Valid Request (from allowed origin)
```bash
curl -H "Origin: https://filmly.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:8080/api/users/login
```

**Expected:**
```
Access-Control-Allow-Origin: https://filmly.com
Access-Control-Allow-Methods: POST, GET, OPTIONS
```

### Invalid Request (from disallowed origin)
```bash
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:8080/api/users/login
```

**Expected:** CORS error or no CORS headers

## Current Status

### ✅ Working Correctly
- Browser communicates only with Gateway (localhost:8080)
- Gateway proxies all requests to internal APIs
- No direct browser → api-users/api-catalog communication

### ⚠️ To Improve for Production
- Restrict Gateway CORS to specific origins
- Remove CORS from api-catalog
- Add Docker network isolation
- Block external access to internal ports
