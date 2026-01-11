from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select

from .db import Base, engine, get_db
from .models import User
from .schemas import SignupIn, LoginIn, AuthOut, UserOut
from .auth import hash_password, verify_password, create_access_token, decode_token

app = FastAPI(title="api-users")

# crea tablas en arranque (simple para proyecto; si quieres migraciones luego metemos Alembic)
Base.metadata.create_all(bind=engine)

bearer = HTTPBearer(auto_error=False)

@app.get("/health")
def health(db: Session = Depends(get_db)):
    """
    Healthcheck endpoint with database verification
    """
    health_status = {
        "status": "ok",
        "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
    }
    
    # Check PostgreSQL
    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        health_status["database"] = "ok"
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["database"] = "fail"
        health_status["dbError"] = str(e)
    
    status_code = 200 if health_status["status"] == "ok" else 503
    return __import__("fastapi").responses.JSONResponse(
        content=health_status,
        status_code=status_code
    )

@app.post("/signup", response_model=AuthOut)
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()

    exists = db.scalar(select(User).where(User.email == email))
    if exists:
        raise HTTPException(status_code=409, detail="Email already registered")

    u = User(email=email, password_hash=hash_password(payload.password))
    db.add(u)
    db.commit()
    db.refresh(u)

    token = create_access_token(subject=str(u.id), extra={"email": u.email})
    return {"access_token": token, "user": {"id": u.id, "email": u.email}}

@app.post("/login", response_model=AuthOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    u = db.scalar(select(User).where(User.email == email))
    if not u or not verify_password(payload.password, u.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(subject=str(u.id), extra={"email": u.email})
    return {"access_token": token, "user": {"id": u.id, "email": u.email}}

@app.get("/me", response_model=UserOut)
def me(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db)
):
    if not creds:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        payload = decode_token(creds.credentials)
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=401, detail="User not found")

    return {"id": u.id, "email": u.email}
