# JWT Configuration

## Overview
Filmly uses JWT (JSON Web Tokens) for authentication and authorization across services.

## Configuration

### JWT_SECRET
- **Location**: 
  - `api-users`: `app/settings.py` (default: `"dev-secret-change-me"`)
  - `api-catalog`: `.env` file (default: `"dev-secret-change-me"`)
  
- **Production**: 
  - ⚠️ **MUST** be changed in production
  - Use a strong random string (32+ characters)
  - Example generation: `openssl rand -hex 32`
  - Set via environment variable:
    ```bash
    JWT_SECRET=your-super-secret-production-key-here
    ```

### Token Structure
```json
{
  "sub": "user_id",           // User ID (subject)
  "email": "user@email.com",  // User email
  "iat": 1234567890,          // Issued at (timestamp)
  "exp": 1234567890           // Expiration (timestamp)
}
```

### Token Expiration
- **Duration**: 7 days (604800 minutes)
- **Configuration**: `api-users/app/settings.py`
  ```python
  JWT_EXPIRES_MIN: int = 60 * 24 * 7  # 7 days
  ```
- **Behavior**:
  - Token is valid for 7 days from issuance
  - After expiration, user must log in again
  - Frontend interceptor (axios) clears token on 401 response

### Algorithm
- **HS256** (HMAC with SHA-256)
- Symmetric signing (same secret for signing & verification)

## Usage

### Token Generation (api-users)
```python
from .auth import create_access_token

token = create_access_token(
    subject=str(user.id),
    extra={"email": user.email}
)
```

### Token Verification (api-catalog)
```typescript
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "";
const payload = jwt.verify(token, secret);
const userId = payload.sub;
const email = payload.email;
```

### Frontend Storage
- **localStorage**: `filmly_token`, `filmly_email`
- **Axios interceptor**: Automatically adds `Authorization: Bearer <token>` header
- **401 handling**: Clears localStorage and redirects to login

## Security Best Practices

### ✅ Implemented
- Token stored in localStorage (not cookies to avoid CSRF)
- HTTPS required in production
- Token included in Authorization header (not URL)
- 401 response triggers automatic logout
- Expiration enforced (7 days)

### 🔒 Production Checklist
- [ ] Change `JWT_SECRET` to strong random value
- [ ] Enable HTTPS/TLS
- [ ] Set appropriate CORS origins (not wildcard)
- [ ] Monitor token refresh patterns
- [ ] Consider refresh tokens for longer sessions
- [ ] Add rate limiting on auth endpoints

## Troubleshooting

### Token Invalid/Expired
- **Symptom**: 401 Unauthorized responses
- **Cause**: Token expired or JWT_SECRET mismatch between services
- **Solution**: 
  1. Verify JWT_SECRET is same in api-users and api-catalog
  2. Check token expiration (7 days)
  3. Clear localStorage and re-login

### Token Not Being Sent
- **Symptom**: Requests fail with 401, frontend has valid token
- **Cause**: Axios interceptor not configured
- **Solution**: Check `frontend/src/services/api.ts` interceptor setup

### Cross-Service Issues
- **Symptom**: api-catalog rejects tokens issued by api-users
- **Cause**: JWT_SECRET mismatch
- **Solution**: Ensure both services use the same JWT_SECRET value
