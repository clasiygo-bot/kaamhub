"""KaamHub backend API tests - covers auth, services, bookings, partner flow, admin flow, withdrawals."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Try frontend/.env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass
if not BASE_URL:
    BASE_URL = "http://localhost:8001"

ADMIN_EMAIL = "admin@kaamhub.in"
ADMIN_PASSWORD = "Admin@12345"

# Unique suffix for this test run to avoid collisions
RUN = uuid.uuid4().hex[:8]
CUSTOMER_EMAIL = f"test_cust_{RUN}@kaamhub.in"
PARTNER_EMAIL = f"test_part_{RUN}@kaamhub.in"
PWD = "Passw0rd!"


def _session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_sess():
    s = _session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


def _register_or_login(email: str, role: str, name: str, phone: str):
    s = _session()
    r = s.post(f"{BASE_URL}/api/auth/register", json={
        "name": name, "email": email, "password": PWD, "role": role, "phone": phone
    })
    if r.status_code == 400:  # already exists from prior class fixture in another worker
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": PWD})
    assert r.status_code == 200, f"{role} auth failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def customer_sess():
    return _register_or_login(CUSTOMER_EMAIL, "customer", "Test Customer", "9999999991")


@pytest.fixture(scope="module")
def partner_sess():
    return _register_or_login(PARTNER_EMAIL, "partner", "Test Partner", "9999999992")


# ---------------- Health / basic ----------------
class TestHealth:
    def test_root(self):
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ---------------- Auth ----------------
class TestAuth:
    def test_register_login_me_customer(self, customer_sess):
        # /me using cookies
        r = customer_sess.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["email"] == CUSTOMER_EMAIL
        assert data["user"]["role"] == "customer"
        assert "password_hash" not in data["user"]

    def test_register_partner_creates_partner_stub(self, partner_sess):
        r = partner_sess.get(f"{BASE_URL}/api/partner/me")
        assert r.status_code == 200
        assert r.json()["status"] in ("incomplete", "pending", "approved", "rejected")

    def test_duplicate_email_400(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Dup", "email": CUSTOMER_EMAIL, "password": PWD, "role": "customer"
        })
        assert r.status_code == 400

    def test_login_wrong_password_401(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": CUSTOMER_EMAIL, "password": "wrongpass"})
        assert r.status_code == 401

    def test_admin_login_sets_cookies(self):
        s = _session()
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        # Cookies should be set
        cookie_names = {c.name for c in s.cookies}
        assert "access_token" in cookie_names
        assert "refresh_token" in cookie_names
        assert r.json()["user"]["role"] == "admin"

    def test_me_unauthenticated_401(self):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401


# ---------------- Admin protection ----------------
class TestAdminProtection:
    def test_admin_endpoint_blocks_non_admin(self, customer_sess):
        r = customer_sess.get(f"{BASE_URL}/api/admin/stats")
        assert r.status_code == 403

    def test_admin_endpoint_blocks_unauth(self):
        r = requests.get(f"{BASE_URL}/api/admin/stats")
        assert r.status_code == 401

    def test_admin_stats_keys(self, admin_sess):
        r = admin_sess.get(f"{BASE_URL}/api/admin/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ["total_users", "total_partners", "pending_verification", "approved_partners",
                  "today_bookings", "monthly_revenue", "pending_withdrawals"]:
            assert k in d, f"Missing key: {k}"


# ---------------- Categories / Services seeded ----------------
class TestSeed:
    def test_categories_seeded(self):
        r = requests.get(f"{BASE_URL}/api/categories")
        assert r.status_code == 200
        names = {c["name"] for c in r.json()}
        for required in ["Plumber", "Electrician", "Cleaning", "AC Repair", "Carpenter"]:
            assert required in names, f"Missing category {required}"

    def test_services_seeded(self):
        r = requests.get(f"{BASE_URL}/api/services")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 10
        for s in items:
            assert "price" in s and "image" in s and "name" in s

    def test_offers_seeded(self):
        r = requests.get(f"{BASE_URL}/api/offers")
        assert r.status_code == 200
        assert len(r.json()) >= 1


# ---------------- End-to-end booking flow ----------------
class TestE2EFlow:
    booking_id = None
    partner_user_id = None
    withdrawal_id = None
    service_id = None
    service_category = None

    def test_01_customer_creates_booking(self, customer_sess):
        services = requests.get(f"{BASE_URL}/api/services").json()
        # Pick a Plumber service so we can match partner category
        plumber = next((s for s in services if s["category"] == "Plumber"), services[0])
        TestE2EFlow.service_id = plumber["id"]
        TestE2EFlow.service_category = plumber["category"]

        r = customer_sess.post(f"{BASE_URL}/api/bookings", json={
            "service_id": plumber["id"],
            "address": "123 Test Street",
            "date": "2026-02-15",
            "time": "10:00",
            "notes": "TEST booking"
        })
        assert r.status_code == 200, r.text
        b = r.json()
        assert b["status"] == "pending"
        assert b.get("service") is not None
        assert b.get("customer") is not None
        TestE2EFlow.booking_id = b["id"]

    def test_02_partner_submits_profile_status_pending(self, partner_sess):
        r = partner_sess.post(f"{BASE_URL}/api/partner/profile", json={
            "full_name": "Test Partner", "phone": "9999999992",
            "city": "Mumbai", "area": "Andheri", "experience_years": 3,
            "service_category": TestE2EFlow.service_category,
            "aadhaar_url": "x", "pan_url": "x", "selfie_url": "x",
        })
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "pending"

    def test_03_partner_cannot_see_available_when_not_approved(self, partner_sess):
        r = partner_sess.get(f"{BASE_URL}/api/bookings/available")
        assert r.status_code == 200
        assert r.json() == []

    def test_04_admin_approves_partner(self, admin_sess, partner_sess):
        # find partner user id
        me = partner_sess.get(f"{BASE_URL}/api/auth/me").json()["user"]
        TestE2EFlow.partner_user_id = me["id"]
        r = admin_sess.post(f"{BASE_URL}/api/admin/partners/{me['id']}/verify",
                            json={"action": "approve"})
        assert r.status_code == 200

        # verify partner status now approved
        r2 = partner_sess.get(f"{BASE_URL}/api/partner/me")
        assert r2.json()["status"] == "approved"

    def test_05_partner_sees_available_booking(self, partner_sess):
        r = partner_sess.get(f"{BASE_URL}/api/bookings/available")
        assert r.status_code == 200
        ids = [b["id"] for b in r.json()]
        assert TestE2EFlow.booking_id in ids

    def test_06_partner_accepts_booking(self, partner_sess):
        r = partner_sess.post(f"{BASE_URL}/api/bookings/{TestE2EFlow.booking_id}/accept")
        assert r.status_code == 200, r.text
        b = r.json()
        assert b["status"] == "accepted"
        assert b["partner_id"] == TestE2EFlow.partner_user_id

    def test_07_partner_advances_status(self, partner_sess):
        for s in ["on_the_way", "started", "completed"]:
            r = partner_sess.post(f"{BASE_URL}/api/bookings/{TestE2EFlow.booking_id}/status",
                                  json={"status": s})
            assert r.status_code == 200, f"Failed for {s}: {r.text}"
            assert r.json()["status"] == s

    def test_08_partner_wallet_credited(self, partner_sess):
        r = partner_sess.get(f"{BASE_URL}/api/partner/wallet")
        assert r.status_code == 200
        w = r.json()["wallet"]
        # service price 299 * 0.85 ~ 254.15
        assert w["balance"] > 0, f"Wallet balance not credited: {w}"

    def test_09_partner_withdraw(self, partner_sess):
        r = partner_sess.get(f"{BASE_URL}/api/partner/wallet")
        bal = r.json()["wallet"]["balance"]
        amount = round(bal / 2, 2)
        r2 = partner_sess.post(f"{BASE_URL}/api/partner/withdraw", json={"amount": amount})
        assert r2.status_code == 200, r2.text
        wd = r2.json()
        assert wd["status"] == "pending"
        TestE2EFlow.withdrawal_id = wd["id"]
        # balance reduced
        r3 = partner_sess.get(f"{BASE_URL}/api/partner/wallet")
        assert r3.json()["wallet"]["balance"] < bal

    def test_10_admin_approves_and_marks_paid(self, admin_sess):
        wid = TestE2EFlow.withdrawal_id
        r = admin_sess.post(f"{BASE_URL}/api/admin/withdrawals/{wid}/action",
                            json={"action": "approve"})
        assert r.status_code == 200
        r2 = admin_sess.post(f"{BASE_URL}/api/admin/withdrawals/{wid}/action",
                             json={"action": "mark_paid", "utr": "UTRTEST123"})
        assert r2.status_code == 200
        items = admin_sess.get(f"{BASE_URL}/api/admin/withdrawals", params={"status_filter": "paid"}).json()
        assert any(it["id"] == wid and it["utr"] == "UTRTEST123" for it in items)

    def test_11_reject_withdraw_refunds(self, partner_sess, admin_sess):
        r = partner_sess.get(f"{BASE_URL}/api/partner/wallet")
        bal_before = r.json()["wallet"]["balance"]
        if bal_before <= 0:
            pytest.skip("No remaining balance to test reject refund")
        amount = round(bal_before, 2)
        r2 = partner_sess.post(f"{BASE_URL}/api/partner/withdraw", json={"amount": amount})
        assert r2.status_code == 200
        wid = r2.json()["id"]
        # Reject
        r3 = admin_sess.post(f"{BASE_URL}/api/admin/withdrawals/{wid}/action",
                             json={"action": "reject", "reason": "test"})
        assert r3.status_code == 200
        # Wallet should be refunded
        r4 = partner_sess.get(f"{BASE_URL}/api/partner/wallet")
        bal_after = r4.json()["wallet"]["balance"]
        assert abs(bal_after - bal_before) < 0.01, f"Refund failed: before={bal_before} after={bal_after}"


# ---------------- Services CRUD by admin ----------------
class TestAdminServices:
    def test_admin_can_create_service(self, admin_sess):
        r = admin_sess.post(f"{BASE_URL}/api/services", json={
            "name": f"TEST_Service_{RUN}", "category": "Plumber",
            "price": 99.0, "duration_min": 30, "image": "x", "description": "test"
        })
        assert r.status_code == 200
        sid = r.json()["id"]
        # cleanup
        d = admin_sess.delete(f"{BASE_URL}/api/services/{sid}")
        assert d.status_code == 200

    def test_non_admin_cannot_create_service(self, customer_sess):
        r = customer_sess.post(f"{BASE_URL}/api/services", json={
            "name": "x", "category": "Plumber", "price": 1.0
        })
        assert r.status_code == 403
