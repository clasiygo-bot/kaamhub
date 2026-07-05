from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import secrets
import hmac
import hashlib
import base64
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any

import bcrypt
import jwt
import httpx
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, status
from fastapi.responses import RedirectResponse
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


class BannerIn(BaseModel):
    title: str
    subtitle: Optional[str] = ""
    image: str
    link: Optional[str] = ""
    placement: str = Field(pattern="^(customer_home|partner_home|both)$", default="customer_home")
    active: bool = True
    order: int = 0


class BonusIn(BaseModel):
    amount: float = Field(gt=0)
    reason: str


class TicketIn(BaseModel):
    subject: str
    message: str
    priority: str = Field(pattern="^(low|normal|high)$", default="normal")
    category: Optional[str] = "general"  # general | booking | payment | account | partner


class TicketReplyIn(BaseModel):
    message: str


class TicketStatusIn(BaseModel):
    status: str  # open | in_progress | resolved | closed


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
        # attach partner's last known live location
        pp = await db.partners.find_one({"user_id": b["partner_id"]}, {"_id": 0})
        if pp:
            b["partner_location"] = {
                "lat": pp.get("last_lat"),
                "lng": pp.get("last_lng"),
                "at": pp.get("last_loc_at"),
            }
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
        "payment_status": "unpaid",  # unpaid | paid
        "payment_method": "",
        "payment_ref": "",
        "paid_at": None,
        "status_history": [{"status": "pending", "at": iso(now_utc())}],
        "created_at": iso(now_utc()),
    }
    await db.bookings.insert_one(booking)

    # Notify nearby/available approved partners of this category (broadcast pool)
    wa_text = f"New KaamHub booking%0A%0A{service.get('name')}%0A{payload.address}%0A{payload.date} at {payload.time}%0AAmount: ₹{service.get('price', 0)}"
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "scope": "category",
        "category": service.get("category", ""),
        "title": "New booking request",
        "body": f"{service.get('name')} • {payload.address}",
        "booking_id": booking["id"],
        "wa_message": wa_text,
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
    partner = await db.partners.find_one({
    "user_id": user["id"],
    "status": "approved",
    "online": True
})
if not partner:
    return[]
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
    elif user["role"] == "admin":
        q = {"$or": [{"user_id": user["id"]}, {"scope": "all"}, {"scope": "admin"}]}
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


@api.get("/admin/users/{uid}")
async def admin_user_detail(uid: str, _: Dict = Depends(require_role("admin"))):
    u = await db.users.find_one({"id": uid}, {"_id": 0, "password_hash": 0})
    if not u:
        raise HTTPException(404, "User not found")
    bookings = []
    if u["role"] == "customer":
        items = await db.bookings.find({"customer_id": uid}).sort("created_at", -1).to_list(500)
        bookings = [await _booking_to_view(b) for b in items]
        spent = sum(float(b.get("amount", 0)) for b in bookings if b.get("status") == "completed")
        return {"user": u, "bookings": bookings, "stats": {"total_bookings": len(bookings), "completed": sum(1 for b in bookings if b.get("status") == "completed"), "total_spent": spent}}
    elif u["role"] == "partner":
        partner = await db.partners.find_one({"user_id": uid}, {"_id": 0}) or {}
        items = await db.bookings.find({"partner_id": uid}).sort("created_at", -1).to_list(500)
        bookings = [await _booking_to_view(b) for b in items]
        wallet = await db.wallets.find_one({"user_id": uid}, {"_id": 0}) or {"balance": 0, "total_earned": 0}
        withdrawals = await db.withdrawals.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(200)
        reviews = await db.reviews.find({"partner_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(200)
        return {"user": u, "partner": partner, "wallet": wallet, "withdrawals": withdrawals, "bookings": bookings, "reviews": reviews, "stats": {"completed": sum(1 for b in bookings if b.get("status") == "completed")}}
    return {"user": u, "bookings": []}


@api.put("/admin/users/{uid}")
async def admin_update_user(uid: str, body: Dict[str, Any], _: Dict = Depends(require_role("admin"))):
    allowed = {k: v for k, v in body.items() if k in {"name", "phone", "active"}}
    if not allowed:
        raise HTTPException(400, "Nothing to update")
    res = await db.users.update_one({"id": uid}, {"$set": allowed})
    if res.matched_count == 0:
        raise HTTPException(404, "User not found")
    return {"ok": True}


@api.put("/admin/partners/{user_id}")
async def admin_update_partner(user_id: str, body: Dict[str, Any], _: Dict = Depends(require_role("admin"))):
    allowed_keys = {"full_name", "phone", "city", "area", "experience_years", "service_category", "profile_photo", "aadhaar_url", "pan_url", "selfie_url", "bank_account", "ifsc", "upi_id", "online"}
    allowed = {k: v for k, v in body.items() if k in allowed_keys}
    if not allowed:
        raise HTTPException(400, "Nothing to update")
    res = await db.partners.update_one({"user_id": user_id}, {"$set": allowed})
    if res.matched_count == 0:
        raise HTTPException(404, "Partner not found")
    return {"ok": True}


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


@api.post("/admin/bookings/{bid}/payment")
async def admin_mark_payment(bid: str, body: Dict[str, Any], _: Dict = Depends(require_role("admin"))):
    """Admin manually marks a booking payment as received."""
    b = await db.bookings.find_one({"id": bid})
    if not b:
        raise HTTPException(404, "Booking not found")
    action = body.get("action", "mark_paid")  # mark_paid | mark_unpaid
    if action == "mark_paid":
        update = {
            "payment_status": "paid",
            "payment_method": body.get("payment_method", "cash"),
            "payment_ref": body.get("payment_ref", ""),
            "paid_at": iso(now_utc()),
        }
        await db.bookings.update_one({"id": bid}, {"$set": update})
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()), "user_id": b["customer_id"],
            "title": "Payment received",
            "body": f"₹{b.get('amount', 0)} payment confirmed for your booking.",
            "booking_id": bid, "read": False, "created_at": iso(now_utc()),
        })
    elif action == "mark_unpaid":
        await db.bookings.update_one({"id": bid}, {"$set": {"payment_status": "unpaid", "payment_ref": "", "paid_at": None}})
    else:
        raise HTTPException(400, "Invalid action")
    nb = await db.bookings.find_one({"id": bid})
    return await _booking_to_view(nb)


@api.put("/admin/bookings/{bid}")
async def admin_edit_booking(bid: str, body: Dict[str, Any], _: Dict = Depends(require_role("admin"))):
    """Admin can edit booking address/date/time/notes/amount."""
    allowed = {k: v for k, v in body.items() if k in {"address", "date", "time", "notes", "amount", "status"}}
    if not allowed:
        raise HTTPException(400, "Nothing to update")
    if "status" in allowed:
        allowed["status_history"] = None  # placeholder
        # push history entry
        await db.bookings.update_one({"id": bid}, {"$push": {"status_history": {"status": allowed["status"], "at": iso(now_utc()), "by": "admin"}}})
        del allowed["status_history"]
    res = await db.bookings.update_one({"id": bid}, {"$set": allowed})
    if res.matched_count == 0:
        raise HTTPException(404, "Booking not found")
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


# ---------------------- Cashfree Payments ----------------------
CASHFREE_API_VERSION = "2025-01-01"


def cashfree_base_url() -> str:
    mode = (os.environ.get("CASHFREE_MODE") or "sandbox").lower()
    return "https://api.cashfree.com/pg" if mode == "production" else "https://sandbox.cashfree.com/pg"


def cashfree_headers() -> Dict[str, str]:
    return {
        "x-client-id": os.environ.get("CASHFREE_APP_ID", ""),
        "x-client-secret": os.environ.get("CASHFREE_SECRET_KEY", ""),
        "x-api-version": CASHFREE_API_VERSION,
        "Content-Type": "application/json",
    }


def cashfree_configured() -> bool:
    return bool(os.environ.get("CASHFREE_APP_ID") and os.environ.get("CASHFREE_SECRET_KEY"))


@api.post("/payments/cashfree/init/{bid}")
async def cashfree_init(bid: str, user: Dict = Depends(require_role("customer"))):
    """Create a Cashfree order for an unpaid booking and return payment_session_id."""
    if not cashfree_configured():
        raise HTTPException(503, "Payment gateway not configured. Please contact support.")
    b = await db.bookings.find_one({"id": bid})
    if not b:
        raise HTTPException(404, "Booking not found")
    if b["customer_id"] != user["id"]:
        raise HTTPException(403, "Not your booking")
    if b.get("payment_status") == "paid":
        raise HTTPException(400, "Booking already paid")
    if b.get("status") == "cancelled":
        raise HTTPException(400, "Booking cancelled")

    cf_order_id = f"KH-{bid[:8]}-{int(now_utc().timestamp())}"
    frontend = os.environ.get("FRONTEND_URL", "")
    backend_public = frontend  # in this env backend & frontend share host via ingress
    payload = {
        "order_id": cf_order_id,
        "order_amount": float(b.get("amount", 0)),
        "order_currency": "INR",
        "customer_details": {
            "customer_id": user["id"],
            "customer_email": user["email"],
            "customer_phone": (user.get("phone") or "9999999999")[:10],
            "customer_name": user.get("name", "Customer"),
        },
        "order_meta": {
            "return_url": f"{backend_public}/api/payments/cashfree/return?cf_order_id={cf_order_id}",
            "notify_url": f"{backend_public}/api/payments/cashfree/webhook",
        },
        "order_note": f"KaamHub booking {bid[:8]}",
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client_h:
            r = await client_h.post(f"{cashfree_base_url()}/orders", json=payload, headers=cashfree_headers())
            data = r.json()
            if r.status_code >= 400:
                logger.error(f"Cashfree create-order failed: {data}")
                raise HTTPException(502, data.get("message", "Payment gateway error"))
    except httpx.HTTPError as e:
        raise HTTPException(502, f"Payment gateway unreachable: {e}")

    psid = data.get("payment_session_id")
    if not psid:
        raise HTTPException(502, "Payment session not created")

    await db.bookings.update_one({"id": bid}, {"$set": {
        "cf_order_id": cf_order_id,
        "payment_status": "initiated",
    }})
    return {"payment_session_id": psid, "cf_order_id": cf_order_id, "mode": (os.environ.get("CASHFREE_MODE") or "sandbox").lower()}


async def _verify_and_mark_paid_by_cf_order(cf_order_id: str) -> Optional[Dict[str, Any]]:
    """Hit Cashfree get-order and atomically mark booking paid if order_status=PAID."""
    if not cashfree_configured():
        return None
    try:
        async with httpx.AsyncClient(timeout=15) as client_h:
            r = await client_h.get(f"{cashfree_base_url()}/orders/{cf_order_id}", headers=cashfree_headers())
            cf = r.json()
    except httpx.HTTPError:
        return None
    if cf.get("order_status") != "PAID":
        return cf
    b = await db.bookings.find_one({"cf_order_id": cf_order_id})
    if not b:
        return cf
    if b.get("payment_status") == "paid":
        return cf
    cf_payment_id = ""
    # get payments for this order
    try:
        async with httpx.AsyncClient(timeout=10) as client_h:
            pr = await client_h.get(f"{cashfree_base_url()}/orders/{cf_order_id}/payments", headers=cashfree_headers())
            plist = pr.json() if pr.status_code < 400 else []
            if isinstance(plist, list) and plist:
                cf_payment_id = str(plist[0].get("cf_payment_id", ""))
    except httpx.HTTPError:
        pass

    await db.bookings.update_one({"id": b["id"]}, {"$set": {
        "payment_status": "paid",
        "payment_method": "cashfree",
        "payment_ref": cf_payment_id or cf_order_id,
        "paid_at": iso(now_utc()),
    }})
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()), "user_id": b["customer_id"],
        "title": "Payment received",
        "body": f"₹{b.get('amount', 0)} payment confirmed via Cashfree.",
        "booking_id": b["id"], "read": False, "created_at": iso(now_utc()),
    })
    return cf


@api.get("/payments/cashfree/return")
async def cashfree_return(cf_order_id: str = "", order_id: str = ""):
    """Cashfree redirects user here after checkout. We verify status then redirect to frontend."""
    oid = cf_order_id or order_id
    front = os.environ.get("FRONTEND_URL", "")
    if not oid:
        return RedirectResponse(f"{front}/customer/bookings")
    cf = await _verify_and_mark_paid_by_cf_order(oid)
    success = bool(cf and cf.get("order_status") == "PAID")
    # find the booking to redirect to its detail page
    b = await db.bookings.find_one({"cf_order_id": oid})
    booking_id = b["id"] if b else ""
    target = f"{front}/payment/{'success' if success else 'failed'}?booking={booking_id}"
    return RedirectResponse(target)


@api.post("/payments/cashfree/webhook")
async def cashfree_webhook(request: Request):
    """Receive Cashfree webhook + verify signature + mark booking paid (idempotent)."""
    secret = os.environ.get("CASHFREE_SECRET_KEY", "")
    timestamp = request.headers.get("x-webhook-timestamp", "")
    signature = request.headers.get("x-webhook-signature", "")
    raw = await request.body()
    if not secret or not timestamp or not signature:
        raise HTTPException(400, "Missing signature headers")
    msg = (timestamp + raw.decode("utf-8")).encode("utf-8")
    digest = hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).digest()
    expected = base64.b64encode(digest).decode()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(400, "Invalid signature")
    try:
        payload = json.loads(raw.decode("utf-8") or "{}")
    except Exception:
        raise HTTPException(400, "Invalid JSON")
    data = payload.get("data", {}) or {}
    order = data.get("order", {}) or {}
    cf_order_id = order.get("order_id") or payload.get("order_id")
    if cf_order_id:
        await _verify_and_mark_paid_by_cf_order(cf_order_id)
    return {"ok": True}


# ---------------------- Payment Settings (admin-driven) ----------------------
SETTINGS_ID = "payment_settings"

DEFAULT_SETTINGS = {
    "id": SETTINGS_ID,
    "qr_image_url": "",
    "upi_id": "",
    "upi_payee_name": "KaamHub",
    "enable_qr": False,
    "enable_upi_intent": False,
    "enable_cashfree": False,
    "enable_razorpay": False,
    "razorpay_key_id": "",
    "razorpay_key_secret": "",
    "cashfree_app_id": "",
    "cashfree_secret_key": "",
    "cashfree_mode": "sandbox",
}


async def _get_settings() -> Dict[str, Any]:
    s = await db.settings.find_one({"id": SETTINGS_ID}, {"_id": 0})
    if not s:
        await db.settings.insert_one({**DEFAULT_SETTINGS, "created_at": iso(now_utc())})
        return {**DEFAULT_SETTINGS}
    # ensure all keys exist
    return {**DEFAULT_SETTINGS, **s}


@api.get("/payment-settings")
async def get_payment_settings_public(_: Dict = Depends(get_current_user)):
    """Public-ish: any authenticated user sees what payment options are enabled and the QR/UPI info."""
    s = await _get_settings()
    return {
        "enable_qr": s["enable_qr"] and bool(s["qr_image_url"]),
        "enable_upi_intent": s["enable_upi_intent"] and bool(s["upi_id"]),
        "enable_cashfree": s["enable_cashfree"] and bool(s["cashfree_app_id"]) and bool(s["cashfree_secret_key"]),
        "enable_razorpay": s["enable_razorpay"] and bool(s["razorpay_key_id"]) and bool(s["razorpay_key_secret"]),
        "qr_image_url": s["qr_image_url"] if s["enable_qr"] else "",
        "upi_id": s["upi_id"] if (s["enable_upi_intent"] or s["enable_qr"]) else "",
        "upi_payee_name": s["upi_payee_name"] or "KaamHub",
        "cashfree_mode": s["cashfree_mode"],
        "razorpay_key_id": s["razorpay_key_id"] if s["enable_razorpay"] else "",  # public key only
    }


@api.get("/admin/payment-settings")
async def get_payment_settings_admin(_: Dict = Depends(require_role("admin"))):
    return await _get_settings()


@api.put("/admin/payment-settings")
async def update_payment_settings(body: Dict[str, Any], _: Dict = Depends(require_role("admin"))):
    allowed_keys = set(DEFAULT_SETTINGS.keys()) - {"id"}
    update = {k: v for k, v in body.items() if k in allowed_keys}
    if not update:
        raise HTTPException(400, "Nothing to update")
    update["updated_at"] = iso(now_utc())
    await db.settings.update_one({"id": SETTINGS_ID}, {"$set": update}, upsert=True)
    # Also reflect cashfree creds into process env so live integration picks them without restart
    if "cashfree_app_id" in update:
        os.environ["CASHFREE_APP_ID"] = update["cashfree_app_id"] or ""
    if "cashfree_secret_key" in update:
        os.environ["CASHFREE_SECRET_KEY"] = update["cashfree_secret_key"] or ""
    if "cashfree_mode" in update:
        os.environ["CASHFREE_MODE"] = update["cashfree_mode"] or "sandbox"
    return await _get_settings()


# ---------------------- Partner live location ----------------------
class PartnerLocationIn(BaseModel):
    lat: float
    lng: float


@api.post("/partner/location")
async def update_partner_location(payload: PartnerLocationIn, user: Dict = Depends(require_role("partner"))):
    await db.partners.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "last_lat": payload.lat,
            "last_lng": payload.lng,
            "last_loc_at": iso(now_utc()),
        }},
        upsert=False,
    )
    return {"ok": True}


# ---------------------- Partner marks payment received ----------------------
class PartnerPaymentIn(BaseModel):
    method: str = "cash"  # cash | upi | qr | other
    ref: Optional[str] = ""


@api.post("/partner/bookings/{bid}/mark-payment")
async def partner_mark_payment(bid: str, payload: PartnerPaymentIn, user: Dict = Depends(require_role("partner"))):
    b = await db.bookings.find_one({"id": bid})
    if not b:
        raise HTTPException(404, "Booking not found")
    if b.get("partner_id") != user["id"]:
        raise HTTPException(403, "Not your booking")
    if b.get("payment_status") == "paid":
        raise HTTPException(400, "Already paid")
    await db.bookings.update_one({"id": bid}, {"$set": {
        "payment_status": "paid",
        "payment_method": payload.method,
        "payment_ref": payload.ref or "",
        "paid_at": iso(now_utc()),
        "payment_marked_by": "partner",
    }})
    # notify customer + admin (broadcast to all admins via scope)
    now = iso(now_utc())
    await db.notifications.insert_many([
        {"id": str(uuid.uuid4()), "user_id": b["customer_id"], "title": "Payment confirmed",
         "body": f"Partner confirmed ₹{b.get('amount', 0)} ({payload.method}). Thank you!",
         "booking_id": bid, "read": False, "created_at": now},
        {"id": str(uuid.uuid4()), "scope": "admin", "title": "Partner marked payment received",
         "body": f"Booking {bid[:8]} • ₹{b.get('amount', 0)} via {payload.method}{(' • Ref ' + payload.ref) if payload.ref else ''}",
         "booking_id": bid, "read": False, "created_at": now},
    ])
    nb = await db.bookings.find_one({"id": bid})
    return await _booking_to_view(nb)


# ---------------------- Banners ----------------------
@api.get("/banners")
async def list_banners(placement: Optional[str] = None, user: Dict = Depends(get_current_user)):
    q: Dict[str, Any] = {"active": True}
    if placement:
        q["$or"] = [{"placement": placement}, {"placement": "both"}]
    items = await db.banners.find(q, {"_id": 0}).sort("order", 1).to_list(50)
    return items


@api.get("/admin/banners")
async def admin_list_banners(_: Dict = Depends(require_role("admin"))):
    items = await db.banners.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return items


@api.post("/admin/banners")
async def admin_create_banner(payload: BannerIn, _: Dict = Depends(require_role("admin"))):
    doc = {"id": str(uuid.uuid4()), **payload.model_dump(), "created_at": iso(now_utc())}
    await db.banners.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/admin/banners/{bid}")
async def admin_update_banner(bid: str, payload: BannerIn, _: Dict = Depends(require_role("admin"))):
    res = await db.banners.update_one({"id": bid}, {"$set": payload.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(404, "Not found")
    doc = await db.banners.find_one({"id": bid}, {"_id": 0})
    return doc


@api.delete("/admin/banners/{bid}")
async def admin_delete_banner(bid: str, _: Dict = Depends(require_role("admin"))):
    await db.banners.delete_one({"id": bid})
    return {"ok": True}


# ---------------------- Partner Bonuses ----------------------
@api.post("/admin/partners/{user_id}/bonus")
async def admin_credit_bonus(user_id: str, payload: BonusIn, admin: Dict = Depends(require_role("admin"))):
    partner = await db.users.find_one({"id": user_id, "role": "partner"})
    if not partner:
        raise HTTPException(404, "Partner not found")
    now = iso(now_utc())
    bonus = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "amount": payload.amount,
        "reason": payload.reason,
        "credited_by": admin["id"],
        "created_at": now,
    }
    await db.bonuses.insert_one(bonus)
    await db.wallets.update_one(
        {"user_id": user_id},
        {"$inc": {"balance": payload.amount, "total_earned": payload.amount},
         "$setOnInsert": {"id": str(uuid.uuid4()), "user_id": user_id, "created_at": now}},
        upsert=True,
    )
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()), "user_id": user_id,
        "title": "🎉 Bonus credited!",
        "body": f"₹{payload.amount} bonus added: {payload.reason}",
        "read": False, "created_at": now,
    })
    bonus.pop("_id", None)
    return bonus


@api.get("/admin/bonuses")
async def admin_list_bonuses(_: Dict = Depends(require_role("admin"))):
    items = await db.bonuses.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for it in items:
        u = await db.users.find_one({"id": it["user_id"]}, {"_id": 0, "password_hash": 0})
        it["user"] = u
    return items


@api.get("/partner/bonuses")
async def my_bonuses(user: Dict = Depends(require_role("partner"))):
    items = await db.bonuses.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


# ---------------------- Support Tickets ----------------------
@api.post("/support/tickets")
async def create_ticket(payload: TicketIn, user: Dict = Depends(get_current_user)):
    if user["role"] == "admin":
        raise HTTPException(400, "Admins cannot raise tickets")
    now = iso(now_utc())
    ticket = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_role": user["role"],
        "subject": payload.subject,
        "priority": payload.priority,
        "category": payload.category or "general",
        "status": "open",
        "messages": [{
            "id": str(uuid.uuid4()),
            "author_id": user["id"],
            "author_role": user["role"],
            "author_name": user.get("name", ""),
            "message": payload.message,
            "at": now,
        }],
        "created_at": now,
        "updated_at": now,
    }
    await db.tickets.insert_one(ticket)
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()), "scope": "admin",
        "title": f"New {payload.priority} priority ticket",
        "body": f"{user['name']}: {payload.subject}",
        "ticket_id": ticket["id"], "read": False, "created_at": now,
    })
    ticket.pop("_id", None)
    return ticket


@api.get("/support/tickets/mine")
async def my_tickets(user: Dict = Depends(get_current_user)):
    if user["role"] == "admin":
        return []
    items = await db.tickets.find({"user_id": user["id"]}, {"_id": 0}).sort("updated_at", -1).to_list(200)
    return items


@api.get("/support/tickets/{tid}")
async def get_ticket(tid: str, user: Dict = Depends(get_current_user)):
    t = await db.tickets.find_one({"id": tid}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Not found")
    if user["role"] != "admin" and t["user_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    return t


@api.post("/support/tickets/{tid}/reply")
async def reply_ticket(tid: str, payload: TicketReplyIn, user: Dict = Depends(get_current_user)):
    t = await db.tickets.find_one({"id": tid})
    if not t:
        raise HTTPException(404, "Not found")
    if user["role"] != "admin" and t["user_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    now = iso(now_utc())
    msg = {
        "id": str(uuid.uuid4()),
        "author_id": user["id"],
        "author_role": user["role"],
        "author_name": user.get("name", ""),
        "message": payload.message,
        "at": now,
    }
    updates = {"$push": {"messages": msg}, "$set": {"updated_at": now}}
    if user["role"] == "admin" and t.get("status") == "open":
        updates["$set"]["status"] = "in_progress"
    await db.tickets.update_one({"id": tid}, updates)
    # notify the other side
    if user["role"] == "admin":
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()), "user_id": t["user_id"],
            "title": f"Support replied: {t['subject']}",
            "body": payload.message[:120],
            "ticket_id": tid, "read": False, "created_at": now,
        })
    else:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()), "scope": "admin",
            "title": f"Ticket reply: {t['subject']}",
            "body": f"{user['name']}: {payload.message[:120]}",
            "ticket_id": tid, "read": False, "created_at": now,
        })
    nt = await db.tickets.find_one({"id": tid}, {"_id": 0})
    return nt


@api.get("/admin/tickets")
async def admin_list_tickets(status_filter: Optional[str] = None, _: Dict = Depends(require_role("admin"))):
    q: Dict[str, Any] = {}
    if status_filter and status_filter != "all":
        q["status"] = status_filter
    items = await db.tickets.find(q, {"_id": 0}).sort("updated_at", -1).to_list(500)
    for it in items:
        u = await db.users.find_one({"id": it["user_id"]}, {"_id": 0, "password_hash": 0})
        it["user"] = u
    return items


@api.post("/admin/tickets/{tid}/status")
async def admin_update_ticket_status(tid: str, payload: TicketStatusIn, _: Dict = Depends(require_role("admin"))):
    if payload.status not in {"open", "in_progress", "resolved", "closed"}:
        raise HTTPException(400, "Invalid status")
    t = await db.tickets.find_one({"id": tid})
    if not t:
        raise HTTPException(404, "Not found")
    await db.tickets.update_one({"id": tid}, {"$set": {"status": payload.status, "updated_at": iso(now_utc())}})
    if payload.status in {"resolved", "closed"}:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()), "user_id": t["user_id"],
            "title": f"Ticket {payload.status}: {t['subject']}",
            "body": "Your support ticket has been marked " + payload.status + ".",
            "ticket_id": tid, "read": False, "created_at": iso(now_utc()),
        })
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
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@kaamhub.io").lower()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "Arman@935276")
    # Drop any other admin accounts so only the configured one exists
    await db.users.delete_many({"role": "admin", "email": {"$ne": admin_email}})
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

    # Hydrate Cashfree creds from DB settings into env if env is empty
    try:
        s = await db.settings.find_one({"id": "payment_settings"}, {"_id": 0})
        if s:
            if s.get("cashfree_app_id") and not os.environ.get("CASHFREE_APP_ID"):
                os.environ["CASHFREE_APP_ID"] = s["cashfree_app_id"]
            if s.get("cashfree_secret_key") and not os.environ.get("CASHFREE_SECRET_KEY"):
                os.environ["CASHFREE_SECRET_KEY"] = s["cashfree_secret_key"]
            if s.get("cashfree_mode") and not os.environ.get("CASHFREE_MODE"):
                os.environ["CASHFREE_MODE"] = s["cashfree_mode"]
    except Exception as e:
        logger.warning(f"Settings hydrate failed: {e}")


@app.on_event("shutdown")
async def shutdown():
    client.close()
