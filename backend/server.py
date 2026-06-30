from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ---------------------- Setup ----------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("kaamhub")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MIN = 60 * 24  # 24h for better UX
REFRESH_TOKEN_DAYS = 30

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="KaamHub API")
api = APIRouter(prefix="/api")


# ---------------------- Helpers ----------------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.isoformat()


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": now_utc() + timedelta(minutes=ACCESS_TOKEN_MIN),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": now_utc() + timedelta(days=REFRESH_TOKEN_DAYS),
        "type": "refresh",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=ACCESS_TOKEN_MIN * 60, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=REFRESH_TOKEN_DAYS * 86400, path="/")


def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


def serialize_user(u: Dict[str, Any]) -> Dict[str, Any]:
    if not u:
        return u
    u = dict(u)
    u.pop("_id", None)
    u.pop("password_hash", None)
    return u


async def get_current_user(request: Request) -> Dict[str, Any]:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_role(*roles: str):
    async def _dep(user: Dict[str, Any] = Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return _dep


# ---------------------- Models ----------------------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: str = Field(pattern="^(customer|partner)$")
    phone: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ServiceIn(BaseModel):
    name: str
    category: str
    description: Optional[str] = ""
    price: float
    duration_min: int = 60
    image: Optional[str] = ""
    active: bool = True


class CategoryIn(BaseModel):
    name: str
    icon: Optional[str] = ""
    image: Optional[str] = ""


class BookingIn(BaseModel):
    service_id: str
    address: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    notes: Optional[str] = ""


class BookingStatusIn(BaseModel):
    status: str  # accepted, on_the_way, started, completed, cancelled


class PartnerProfileIn(BaseModel):
    full_name: str
    phone: str
    city: str
    area: str
    experience_years: int
    service_category: str
    profile_photo: Optional[str] = ""
    aadhaar_url: Optional[str] = ""
    pan_url: Optional[str] = ""
    selfie_url: Optional[str] = ""
    bank_account: Optional[str] = ""
    ifsc: Optional[str] = ""
    upi_id: Optional[str] = ""


class VerificationActionIn(BaseModel):
    action: str  # approve | reject
    reason: Optional[str] = ""


class WithdrawIn(BaseModel):
    amount: float


class WithdrawActionIn(BaseModel):
    action: str  # approve | reject | mark_paid
    utr: Optional[str] = ""
    reason: Optional[str] = ""


class ReviewIn(BaseModel):
    booking_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = ""


class OfferIn(BaseModel):
    code: str
    title: str
    description: Optional[str] = ""
    discount_pct: int = Field(ge=0, le=100)
    image: Optional[str] = ""
    active: bool = True


# ---------------------- Auth Routes ----------------------
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": payload.name.strip(),
        "email": email,
        "phone": payload.phone or "",
        "role": payload.role,
        "password_hash": hash_password(payload.password),
        "active": True,
        "created_at": iso(now_utc()),
    }
    await db.users.insert_one(user_doc)

    # If partner, auto-create a partner_profile stub with pending status
    if payload.role == "partner":
        await db.partners.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "status": "incomplete",  # incomplete -> pending -> approved/rejected
            "rejection_reason": "",
            "online": False,
            "rating_avg": 0,
            "rating_count": 0,
            "created_at": iso(now_utc()),
        })

    access = create_access_token(user_id, email, payload.role)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"user": serialize_user(user_doc), "access_token": access}


@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("active", True):
        raise HTTPException(status_code=403, detail="Account disabled")
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"user": serialize_user(user), "access_token": access}


@api.post("/auth/logout")
async def logout(response: Response, _: Dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user: Dict = Depends(get_current_user)):
    return {"user": serialize_user(user)}


# ---------------------- Categories / Services ----------------------
@api.get("/categories")
async def list_categories():
    items = await db.categories.find({}, {"_id": 0}).to_list(200)
    return items


@api.post("/categories")
async def create_category(payload: CategoryIn, _: Dict = Depends(require_role("admin"))):
    doc = {"id": str(uuid.uuid4()), **payload.model_dump(), "created_at": iso(now_utc())}
    await db.categories.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/services")
async def list_services(category: Optional[str] = None, active_only: bool = True):
    q: Dict[str, Any] = {}
    if category:
        q["category"] = category
    if active_only:
        q["active"] = True
    items = await db.services.find(q, {"_id": 0}).to_list(500)
    return items


@api.get("/services/{service_id}")
async def get_service(service_id: str):
    s = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not s:
        raise HTTPException(404, "Service not found")
    return s


@api.post("/services")
async def create_service(payload: ServiceIn, _: Dict = Depends(require_role("admin"))):
    doc = {"id": str(uuid.uuid4()), **payload.model_dump(), "created_at": iso(now_utc())}
    await db.services.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/services/{service_id}")
async def update_service(service_id: str, payload: ServiceIn, _: Dict = Depends(require_role("admin"))):
    res = await db.services.update_one({"id": service_id}, {"$set": payload.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(404, "Service not found")
    s = await db.services.find_one({"id": service_id}, {"_id": 0})
    return s


@api.delete("/services/{service_id}")
async def delete_service(service_id: str, _: Dict = Depends(require_role("admin"))):
    await db.services.delete_one({"id": service_id})
    return {"ok": True}


# ---------------------- Bookings ----------------------
async def _booking_to_view(b: Dict[str, Any]) -> Dict[str, Any]:
    b = dict(b)
    b.pop("_id", None)
    # attach service + partner + customer minimal
    if b.get("service_id"):
        s = await db.services.find_one({"id": b["service_id"]}, {"_id": 0})
        b["service"] = s
    if b.get("customer_id"):
        c = await db.users.find_one({"id": b["customer_id"]}, {"_id": 0, "password_hash": 0})
        b["customer"] = c
    if b.get("partner_id"):
        p = await db.users.find_one({"id": b["partner_id"]}, {"_id": 0, "password_hash": 0})
        b["partner"] = p
    return b


@api.post("/bookings")
async def create_booking(payload: BookingIn, user: Dict = Depends(require_role("customer"))):
    service = await db.services.find_one({"id": payload.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(404, "Service not found")
    booking = {
        "id": str(uuid.uuid4()),
        "customer_id": user["id"],
        "partner_id": None,
        "service_id": payload.service_id,
        "category": service.get("category", ""),
        "amount": service.get("price", 0),
        "address": payload.address,
        "lat": payload.lat,
        "lng": payload.lng,
        "date": payload.date,
        "time": payload.time,
        "notes": payload.notes or "",
        "status": "pending",
        "status_history": [{"status": "pending", "at": iso(now_utc())}],
        "created_at": iso(now_utc()),
    }
    await db.bookings.insert_one(booking)

    # Notify nearby/available approved partners of this category (broadcast pool)
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "scope": "category",
        "category": service.get("category", ""),
        "title": "New booking request",
        "body": f"{service.get('name')} • {payload.address}",
        "booking_id": booking["id"],
        "read": False,
        "created_at": iso(now_utc()),
    })
    return await _booking_to_view(booking)


@api.get("/bookings/mine")
async def my_bookings(user: Dict = Depends(get_current_user)):
    role = user["role"]
    if role == "customer":
        q = {"customer_id": user["id"]}
    elif role == "partner":
        q = {"partner_id": user["id"]}
    else:
        q = {}
    items = await db.bookings.find(q).sort("created_at", -1).to_list(500)
    return [await _booking_to_view(b) for b in items]


@api.get("/bookings/available")
async def available_bookings(user: Dict = Depends(require_role("partner"))):
    # Show pending bookings matching partner's category if approved
    partner = await db.partners.find_one({"user_id": user["id"]})
    if not partner or partner.get("status") != "approved":
        return []
    cat = partner.get("service_category", "")
    q = {"status": "pending", "partner_id": None}
    if cat:
        q["category"] = cat
    items = await db.bookings.find(q).sort("created_at", -1).to_list(200)
    return [await _booking_to_view(b) for b in items]


@api.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, user: Dict = Depends(get_current_user)):
    b = await db.bookings.find_one({"id": booking_id})
    if not b:
        raise HTTPException(404, "Booking not found")
    if user["role"] == "customer" and b["customer_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    if user["role"] == "partner" and b.get("partner_id") not in (None, user["id"]):
        raise HTTPException(403, "Forbidden")
    return await _booking_to_view(b)


@api.post("/bookings/{booking_id}/accept")
async def accept_booking(booking_id: str, user: Dict = Depends(require_role("partner"))):
    partner = await db.partners.find_one({"user_id": user["id"]})
    if not partner or partner.get("status") != "approved":
        raise HTTPException(403, "Partner not approved")
    b = await db.bookings.find_one({"id": booking_id})
    if not b:
        raise HTTPException(404, "Booking not found")
    if b["status"] != "pending" or b.get("partner_id"):
        raise HTTPException(400, "Booking unavailable")
    now = iso(now_utc())
    await db.bookings.update_one({"id": booking_id}, {
        "$set": {"partner_id": user["id"], "status": "accepted"},
        "$push": {"status_history": {"status": "accepted", "at": now}},
    })
    b = await db.bookings.find_one({"id": booking_id})
    # notify customer
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": b["customer_id"],
        "title": "Booking accepted",
        "body": "A partner accepted your booking",
        "booking_id": booking_id,
        "read": False,
        "created_at": now,
    })
    return await _booking_to_view(b)


@api.post("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, payload: BookingStatusIn, user: Dict = Depends(get_current_user)):
    allowed = {"on_the_way", "started", "completed", "cancelled"}
    if payload.status not in allowed:
        raise HTTPException(400, "Invalid status")
    b = await db.bookings.find_one({"id": booking_id})
    if not b:
        raise HTTPException(404, "Booking not found")
    if user["role"] == "partner" and b.get("partner_id") != user["id"]:
        raise HTTPException(403, "Forbidden")
    if user["role"] == "customer" and b["customer_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    if user["role"] == "customer" and payload.status != "cancelled":
        raise HTTPException(403, "Customers can only cancel")
    now = iso(now_utc())
    update = {"status": payload.status}
    if payload.status == "completed":
        # Credit partner wallet
        amount = float(b.get("amount", 0))
        partner_share = round(amount * 0.85, 2)  # 15% platform fee
        await db.wallets.update_one(
            {"user_id": b["partner_id"]},
            {"$inc": {"balance": partner_share, "total_earned": partner_share},
             "$setOnInsert": {"id": str(uuid.uuid4()), "user_id": b["partner_id"], "created_at": now}},
            upsert=True,
        )
    await db.bookings.update_one({"id": booking_id}, {
        "$set": update,
        "$push": {"status_history": {"status": payload.status, "at": now}},
    })
    b = await db.bookings.find_one({"id": booking_id})
    return await _booking_to_view(b)


# ---------------------- Partner ----------------------
@api.get("/partner/me")
async def partner_me(user: Dict = Depends(require_role("partner"))):
    p = await db.partners.find_one({"user_id": user["id"]}, {"_id": 0})
    if not p:
        # create stub
        p = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "status": "incomplete",
            "rejection_reason": "",
            "online": False,
            "created_at": iso(now_utc()),
        }
        await db.partners.insert_one(p)
        p.pop("_id", None)
    return p


@api.post("/partner/profile")
async def submit_partner_profile(payload: PartnerProfileIn, user: Dict = Depends(require_role("partner"))):
    p = await db.partners.find_one({"user_id": user["id"]})
    update = payload.model_dump()
    update["status"] = "pending"
    update["rejection_reason"] = ""
    update["updated_at"] = iso(now_utc())
    if not p:
        update["id"] = str(uuid.uuid4())
        update["user_id"] = user["id"]
        update["created_at"] = iso(now_utc())
        update["online"] = False
        await db.partners.insert_one(update)
    else:
        await db.partners.update_one({"user_id": user["id"]}, {"$set": update})
    p = await db.partners.find_one({"user_id": user["id"]}, {"_id": 0})
    return p


@api.post("/partner/online")
async def toggle_online(body: Dict[str, bool], user: Dict = Depends(require_role("partner"))):
    online = bool(body.get("online", False))
    await db.partners.update_one({"user_id": user["id"]}, {"$set": {"online": online}})
    return {"online": online}


@api.get("/partner/wallet")
async def partner_wallet(user: Dict = Depends(require_role("partner"))):
    w = await db.wallets.find_one({"user_id": user["id"]}, {"_id": 0})
    if not w:
        w = {"id": str(uuid.uuid4()), "user_id": user["id"], "balance": 0, "total_earned": 0, "created_at": iso(now_utc())}
        await db.wallets.insert_one(w)
        w.pop("_id", None)
    withdrawals = await db.withdrawals.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"wallet": w, "withdrawals": withdrawals}


@api.post("/partner/withdraw")
async def request_withdrawal(payload: WithdrawIn, user: Dict = Depends(require_role("partner"))):
    w = await db.wallets.find_one({"user_id": user["id"]})
    if not w or float(w.get("balance", 0)) < payload.amount or payload.amount <= 0:
        raise HTTPException(400, "Insufficient balance")
    wd = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "amount": payload.amount,
        "status": "pending",  # pending -> approved -> paid | rejected
        "utr": "",
        "reason": "",
        "created_at": iso(now_utc()),
    }
    await db.withdrawals.insert_one(wd)
    await db.wallets.update_one({"user_id": user["id"]}, {"$inc": {"balance": -payload.amount}})
    wd.pop("_id", None)
    return wd


# ---------------------- Notifications ----------------------
@api.get("/notifications")
async def list_notifications(user: Dict = Depends(get_current_user)):
    if user["role"] == "partner":
        partner = await db.partners.find_one({"user_id": user["id"]})
        cat = partner.get("service_category", "") if partner else ""
        q = {"$or": [{"user_id": user["id"]}, {"scope": "category", "category": cat}]}
    else:
        q = {"$or": [{"user_id": user["id"]}, {"scope": "all"}]}
    items = await db.notifications.find(q, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items


@api.post("/notifications/{nid}/read")
async def read_notification(nid: str, _: Dict = Depends(get_current_user)):
    await db.notifications.update_one({"id": nid}, {"$set": {"read": True}})
    return {"ok": True}


# ---------------------- Reviews ----------------------
@api.post("/reviews")
async def add_review(payload: ReviewIn, user: Dict = Depends(require_role("customer"))):
    b = await db.bookings.find_one({"id": payload.booking_id})
    if not b or b["customer_id"] != user["id"]:
        raise HTTPException(404, "Booking not found")
    if b.get("status") != "completed":
        raise HTTPException(400, "Booking not completed")
    review = {
        "id": str(uuid.uuid4()),
        "booking_id": payload.booking_id,
        "customer_id": user["id"],
        "partner_id": b.get("partner_id"),
        "rating": payload.rating,
        "comment": payload.comment or "",
        "created_at": iso(now_utc()),
    }
    await db.reviews.insert_one(review)
    # update partner rating
    if b.get("partner_id"):
        agg = await db.reviews.aggregate([
            {"$match": {"partner_id": b["partner_id"]}},
            {"$group": {"_id": "$partner_id", "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
        ]).to_list(1)
        if agg:
            await db.partners.update_one({"user_id": b["partner_id"]}, {"$set": {"rating_avg": round(agg[0]["avg"], 2), "rating_count": agg[0]["count"]}})
    review.pop("_id", None)
    return review


@api.get("/reviews/partner/{partner_user_id}")
async def reviews_for_partner(partner_user_id: str):
    items = await db.reviews.find({"partner_id": partner_user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items


# ---------------------- Offers ----------------------
@api.get("/offers")
async def list_offers():
    items = await db.offers.find({"active": True}, {"_id": 0}).to_list(50)
    return items


@api.post("/offers")
async def create_offer(payload: OfferIn, _: Dict = Depends(require_role("admin"))):
    doc = {"id": str(uuid.uuid4()), **payload.model_dump(), "created_at": iso(now_utc())}
    await db.offers.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.delete("/offers/{oid}")
async def delete_offer(oid: str, _: Dict = Depends(require_role("admin"))):
    await db.offers.delete_one({"id": oid})
    return {"ok": True}


# ---------------------- Admin ----------------------
@api.get("/admin/stats")
async def admin_stats(_: Dict = Depends(require_role("admin"))):
    total_users = await db.users.count_documents({"role": "customer"})
    total_partners = await db.users.count_documents({"role": "partner"})
    pending_v = await db.partners.count_documents({"status": "pending"})
    approved_v = await db.partners.count_documents({"status": "approved"})
    rejected_v = await db.partners.count_documents({"status": "rejected"})
    today = now_utc().strftime("%Y-%m-%d")
    today_bookings = await db.bookings.count_documents({"created_at": {"$regex": f"^{today}"}})
    pending_wd = await db.withdrawals.count_documents({"status": "pending"})
    # monthly revenue (completed bookings this month)
    month = now_utc().strftime("%Y-%m")
    pipeline = [
        {"$match": {"status": "completed", "created_at": {"$regex": f"^{month}"}}},
        {"$group": {"_id": None, "sum": {"$sum": "$amount"}}},
    ]
    agg = await db.bookings.aggregate(pipeline).to_list(1)
    revenue = agg[0]["sum"] if agg else 0
    return {
        "total_users": total_users,
        "total_partners": total_partners,
        "pending_verification": pending_v,
        "approved_partners": approved_v,
        "rejected_partners": rejected_v,
        "today_bookings": today_bookings,
        "monthly_revenue": revenue,
        "pending_withdrawals": pending_wd,
    }


@api.get("/admin/users")
async def admin_list_users(role: Optional[str] = None, _: Dict = Depends(require_role("admin"))):
    q = {"role": role} if role else {}
    users = await db.users.find(q, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    return users


@api.post("/admin/users/{uid}/toggle")
async def admin_toggle_user(uid: str, _: Dict = Depends(require_role("admin"))):
    u = await db.users.find_one({"id": uid})
    if not u:
        raise HTTPException(404, "Not found")
    await db.users.update_one({"id": uid}, {"$set": {"active": not u.get("active", True)}})
    return {"ok": True, "active": not u.get("active", True)}


@api.delete("/admin/users/{uid}")
async def admin_delete_user(uid: str, _: Dict = Depends(require_role("admin"))):
    await db.users.delete_one({"id": uid})
    await db.partners.delete_many({"user_id": uid})
    return {"ok": True}


@api.get("/admin/partners")
async def admin_list_partners(status_filter: Optional[str] = None, _: Dict = Depends(require_role("admin"))):
    q = {"status": status_filter} if status_filter else {}
    partners = await db.partners.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    # join user
    out = []
    for p in partners:
        u = await db.users.find_one({"id": p["user_id"]}, {"_id": 0, "password_hash": 0})
        p["user"] = u
        out.append(p)
    return out


@api.post("/admin/partners/{user_id}/verify")
async def admin_verify(user_id: str, payload: VerificationActionIn, _: Dict = Depends(require_role("admin"))):
    p = await db.partners.find_one({"user_id": user_id})
    if not p:
        raise HTTPException(404, "Partner not found")
    if payload.action == "approve":
        await db.partners.update_one({"user_id": user_id}, {"$set": {"status": "approved", "rejection_reason": ""}})
        title, body = "Verification approved", "Your partner account is approved. Start accepting bookings!"
    elif payload.action == "reject":
        await db.partners.update_one({"user_id": user_id}, {"$set": {"status": "rejected", "rejection_reason": payload.reason or "Documents not valid"}})
        title, body = "Verification rejected", payload.reason or "Please re-submit documents"
    else:
        raise HTTPException(400, "Invalid action")
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()), "user_id": user_id, "title": title, "body": body, "read": False, "created_at": iso(now_utc()),
    })
    return {"ok": True}


@api.get("/admin/bookings")
async def admin_list_bookings(status_filter: Optional[str] = None, _: Dict = Depends(require_role("admin"))):
    q = {"status": status_filter} if status_filter else {}
    items = await db.bookings.find(q).sort("created_at", -1).to_list(2000)
    return [await _booking_to_view(b) for b in items]


@api.post("/admin/bookings/{bid}/assign")
async def admin_assign(bid: str, body: Dict[str, str], _: Dict = Depends(require_role("admin"))):
    partner_user_id = body.get("partner_user_id", "")
    p = await db.partners.find_one({"user_id": partner_user_id, "status": "approved"})
    if not p:
        raise HTTPException(404, "Approved partner not found")
    now = iso(now_utc())
    await db.bookings.update_one({"id": bid}, {
        "$set": {"partner_id": partner_user_id, "status": "accepted"},
        "$push": {"status_history": {"status": "accepted", "at": now}},
    })
    return {"ok": True}


@api.get("/admin/withdrawals")
async def admin_withdrawals(status_filter: Optional[str] = None, _: Dict = Depends(require_role("admin"))):
    q = {"status": status_filter} if status_filter else {}
    items = await db.withdrawals.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    for it in items:
        u = await db.users.find_one({"id": it["user_id"]}, {"_id": 0, "password_hash": 0})
        it["user"] = u
    return items


@api.post("/admin/withdrawals/{wid}/action")
async def admin_withdraw_action(wid: str, payload: WithdrawActionIn, _: Dict = Depends(require_role("admin"))):
    wd = await db.withdrawals.find_one({"id": wid})
    if not wd:
        raise HTTPException(404, "Not found")
    if payload.action == "approve":
        await db.withdrawals.update_one({"id": wid}, {"$set": {"status": "approved"}})
    elif payload.action == "mark_paid":
        await db.withdrawals.update_one({"id": wid}, {"$set": {"status": "paid", "utr": payload.utr or ""}})
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()), "user_id": wd["user_id"], "title": "Payout sent",
            "body": f"₹{wd['amount']} paid. UTR: {payload.utr}", "read": False, "created_at": iso(now_utc()),
        })
    elif payload.action == "reject":
        await db.withdrawals.update_one({"id": wid}, {"$set": {"status": "rejected", "reason": payload.reason or ""}})
        # refund to wallet
        await db.wallets.update_one({"user_id": wd["user_id"]}, {"$inc": {"balance": wd["amount"]}})
    else:
        raise HTTPException(400, "Invalid action")
    return {"ok": True}


# ---------------------- Health ----------------------
@api.get("/")
async def root():
    return {"app": "KaamHub API", "status": "ok"}


app.include_router(api)


# CORS - allow credentials with explicit origins (or wildcard list)
cors_origins = os.environ.get("CORS_ORIGINS", "*")
allow_origins: List[str] = []
if cors_origins == "*":
    # Allow common preview + localhost; in production, set explicit origins
    front = os.environ.get("FRONTEND_URL", "")
    allow_origins = [front] if front else ["*"]
else:
    allow_origins = [o.strip() for o in cors_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------- Seeding ----------------------
DEFAULT_CATEGORIES = [
    {"name": "Plumber", "icon": "wrench", "image": "https://images.pexels.com/photos/29226620/pexels-photo-29226620.jpeg"},
    {"name": "Electrician", "icon": "zap", "image": "https://images.pexels.com/photos/5691588/pexels-photo-5691588.jpeg"},
    {"name": "Cleaning", "icon": "sparkles", "image": "https://images.pexels.com/photos/6195118/pexels-photo-6195118.jpeg"},
    {"name": "AC Repair", "icon": "wind", "image": "https://images.pexels.com/photos/33958627/pexels-photo-33958627.jpeg"},
    {"name": "Carpenter", "icon": "hammer", "image": "https://images.unsplash.com/photo-1608613304810-2d4dd52511a2"},
]

DEFAULT_SERVICES = [
    {"name": "Tap & Leak Repair", "category": "Plumber", "price": 299, "duration_min": 60, "image": "https://images.pexels.com/photos/29226620/pexels-photo-29226620.jpeg", "description": "Fix leaking taps, pipes & basin drainage."},
    {"name": "Bathroom Pipe Fitting", "category": "Plumber", "price": 599, "duration_min": 90, "image": "https://images.pexels.com/photos/33388390/pexels-photo-33388390.jpeg", "description": "Complete bathroom pipe install/repair."},
    {"name": "Switchboard Repair", "category": "Electrician", "price": 249, "duration_min": 45, "image": "https://images.pexels.com/photos/5691588/pexels-photo-5691588.jpeg", "description": "Fix faulty switches & wiring."},
    {"name": "Fan / Light Installation", "category": "Electrician", "price": 199, "duration_min": 30, "image": "https://images.pexels.com/photos/5691589/pexels-photo-5691589.jpeg", "description": "Mount fans, lights & chandeliers."},
    {"name": "Full Home Deep Clean", "category": "Cleaning", "price": 1499, "duration_min": 240, "image": "https://images.pexels.com/photos/6195118/pexels-photo-6195118.jpeg", "description": "Top-to-bottom deep cleaning."},
    {"name": "Bathroom Cleaning", "category": "Cleaning", "price": 399, "duration_min": 60, "image": "https://images.pexels.com/photos/6195129/pexels-photo-6195129.jpeg", "description": "Sanitization & scrubbing."},
    {"name": "AC Service & Gas Refill", "category": "AC Repair", "price": 599, "duration_min": 90, "image": "https://images.pexels.com/photos/33958627/pexels-photo-33958627.jpeg", "description": "Cooling check, filter clean, gas top-up."},
    {"name": "AC Installation", "category": "AC Repair", "price": 1499, "duration_min": 120, "image": "https://images.pexels.com/photos/33671149/pexels-photo-33671149.jpeg", "description": "New AC installation with copper piping."},
    {"name": "Furniture Repair", "category": "Carpenter", "price": 349, "duration_min": 60, "image": "https://images.unsplash.com/photo-1608613304810-2d4dd52511a2", "description": "Repair beds, chairs, doors."},
    {"name": "Modular Wardrobe", "category": "Carpenter", "price": 4999, "duration_min": 360, "image": "https://images.unsplash.com/photo-1731168273756-e02cae42265b", "description": "Custom wardrobe build."},
]

DEFAULT_OFFERS = [
    {"code": "WELCOME20", "title": "20% OFF First Booking", "description": "Get 20% off on your first KaamHub booking.", "discount_pct": 20, "image": "https://images.unsplash.com/photo-1614850715649-1d0106293bd1", "active": True},
    {"code": "AC100", "title": "₹100 off AC Service", "description": "Flat ₹100 off on AC service & gas refill.", "discount_pct": 15, "image": "https://images.unsplash.com/photo-1689718107045-513b35f1a356", "active": True},
]


@app.on_event("startup")
async def startup():
    # indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.partners.create_index("user_id", unique=True)
    await db.bookings.create_index("id", unique=True)
    await db.services.create_index("id", unique=True)
    await db.categories.create_index("id", unique=True)
    await db.notifications.create_index("created_at")

    # seed categories
    if await db.categories.count_documents({}) == 0:
        for c in DEFAULT_CATEGORIES:
            await db.categories.insert_one({"id": str(uuid.uuid4()), **c, "created_at": iso(now_utc())})

    # seed services
    if await db.services.count_documents({}) == 0:
        for s in DEFAULT_SERVICES:
            await db.services.insert_one({"id": str(uuid.uuid4()), **s, "active": True, "created_at": iso(now_utc())})

    # seed offers
    if await db.offers.count_documents({}) == 0:
        for o in DEFAULT_OFFERS:
            await db.offers.insert_one({"id": str(uuid.uuid4()), **o, "created_at": iso(now_utc())})

    # seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@kaamhub.in").lower()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "Admin@12345")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "KaamHub Admin",
            "email": admin_email,
            "phone": "",
            "role": "admin",
            "password_hash": hash_password(admin_pw),
            "active": True,
            "created_at": iso(now_utc()),
        })
        logger.info(f"Seeded admin: {admin_email}")
    elif not verify_password(admin_pw, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_pw)}})

    logger.info("KaamHub startup complete")


@app.on_event("shutdown")
async def shutdown():
    client.close()
