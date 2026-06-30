"""Iteration 2 tests - Admin Panel: user detail, edits, partner edits, manual payment mark."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

ADMIN_EMAIL = "admin@kaamhub.in"
ADMIN_PASSWORD = "Admin@12345"
PWD = "Passw0rd!"
RUN = uuid.uuid4().hex[:8]
CUST_EMAIL = f"it2_cust_{RUN}@kaamhub.in"
PART_EMAIL = f"it2_part_{RUN}@kaamhub.in"


def _s():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_sess():
    s = _s()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return s


def _register_or_login(email, role, name, phone):
    s = _s()
    r = s.post(f"{BASE_URL}/api/auth/register",
               json={"name": name, "email": email, "password": PWD, "role": role, "phone": phone})
    if r.status_code == 400:
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": PWD})
    assert r.status_code == 200, r.text
    return s, r.json()["user"]["id"]


@pytest.fixture(scope="module")
def customer():
    return _register_or_login(CUST_EMAIL, "customer", "Iter2 Customer", "9000000001")


@pytest.fixture(scope="module")
def partner(admin_sess):
    s, uid = _register_or_login(PART_EMAIL, "partner", "Iter2 Partner", "9000000002")
    # submit profile so partner has a profile
    s.post(f"{BASE_URL}/api/partner/profile", json={
        "full_name": "Iter2 Partner", "phone": "9000000002",
        "city": "Mumbai", "area": "Andheri", "experience_years": 2,
        "service_category": "Plumber",
        "aadhaar_url": "a", "pan_url": "p", "selfie_url": "x",
    })
    # approve so booking flow works
    admin_sess.post(f"{BASE_URL}/api/admin/partners/{uid}/verify", json={"action": "approve"})
    return s, uid


@pytest.fixture(scope="module")
def booking_id(customer, partner, admin_sess):
    cust_sess, _ = customer
    part_sess, part_uid = partner
    services = requests.get(f"{BASE_URL}/api/services").json()
    svc = next((x for x in services if x["category"] == "Plumber"), services[0])
    r = cust_sess.post(f"{BASE_URL}/api/bookings", json={
        "service_id": svc["id"], "address": "Iter2 St", "date": "2026-03-01", "time": "11:00", "notes": "iter2"
    })
    assert r.status_code == 200, r.text
    return r.json()["id"]


# ---------- A) New booking default payment_status='unpaid' ----------
class TestBookingPaymentDefault:
    def test_new_booking_unpaid(self, booking_id, customer):
        cust_sess, _ = customer
        r = cust_sess.get(f"{BASE_URL}/api/bookings/{booking_id}")
        assert r.status_code == 200
        b = r.json()
        assert b.get("payment_status") == "unpaid"
        assert b.get("paid_at") in (None, "")

    def test_admin_bookings_includes_payment_fields(self, admin_sess, booking_id):
        r = admin_sess.get(f"{BASE_URL}/api/admin/bookings")
        assert r.status_code == 200
        items = r.json()
        b = next((x for x in items if x["id"] == booking_id), None)
        assert b is not None
        assert "payment_status" in b and b["payment_status"] == "unpaid"


# ---------- B) Admin user detail ----------
class TestAdminUserDetail:
    def test_customer_detail_returns_user_bookings_stats(self, admin_sess, customer, booking_id):
        _, uid = customer
        r = admin_sess.get(f"{BASE_URL}/api/admin/users/{uid}")
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["email"] == CUST_EMAIL
        assert "bookings" in d and isinstance(d["bookings"], list)
        assert any(b["id"] == booking_id for b in d["bookings"])
        assert "stats" in d
        for k in ["total_bookings", "completed", "total_spent"]:
            assert k in d["stats"], f"missing stats key: {k}"

    def test_partner_detail_returns_full_payload(self, admin_sess, partner):
        _, uid = partner
        r = admin_sess.get(f"{BASE_URL}/api/admin/users/{uid}")
        assert r.status_code == 200
        d = r.json()
        for k in ["user", "partner", "wallet", "withdrawals", "bookings", "reviews", "stats"]:
            assert k in d, f"missing key {k}"
        assert d["user"]["role"] == "partner"

    def test_non_admin_forbidden(self, customer):
        cust_sess, uid = customer
        r = cust_sess.get(f"{BASE_URL}/api/admin/users/{uid}")
        assert r.status_code == 403

    def test_unauth_returns_401(self, customer):
        _, uid = customer
        r = requests.get(f"{BASE_URL}/api/admin/users/{uid}")
        assert r.status_code == 401

    def test_unknown_user_404(self, admin_sess):
        r = admin_sess.get(f"{BASE_URL}/api/admin/users/nonexistent-xyz")
        assert r.status_code == 404


# ---------- C) Admin update user ----------
class TestAdminUpdateUser:
    def test_update_allowed_fields_and_persist(self, admin_sess, customer):
        _, uid = customer
        r = admin_sess.put(f"{BASE_URL}/api/admin/users/{uid}",
                           json={"name": "Updated Name", "phone": "8888888888", "active": True})
        assert r.status_code == 200
        assert r.json() == {"ok": True}
        # verify via GET
        g = admin_sess.get(f"{BASE_URL}/api/admin/users/{uid}")
        u = g.json()["user"]
        assert u["name"] == "Updated Name"
        assert u["phone"] == "8888888888"

    def test_disallowed_fields_ignored(self, admin_sess, customer):
        _, uid = customer
        # Try to change email/role/password — should be ignored, but ok:true may not be returned if no allowed keys.
        r = admin_sess.put(f"{BASE_URL}/api/admin/users/{uid}",
                           json={"email": "hacked@x.com", "role": "admin", "password": "x"})
        # All disallowed → expect 400 "Nothing to update"
        assert r.status_code == 400
        # Confirm role/email unchanged
        g = admin_sess.get(f"{BASE_URL}/api/admin/users/{uid}")
        u = g.json()["user"]
        assert u["email"] == CUST_EMAIL
        assert u["role"] == "customer"

    def test_disallowed_mixed_with_allowed_ignored(self, admin_sess, customer):
        _, uid = customer
        r = admin_sess.put(f"{BASE_URL}/api/admin/users/{uid}",
                           json={"name": "Mixed", "email": "hacked2@x.com", "role": "admin"})
        assert r.status_code == 200
        g = admin_sess.get(f"{BASE_URL}/api/admin/users/{uid}").json()["user"]
        assert g["name"] == "Mixed"
        assert g["email"] == CUST_EMAIL
        assert g["role"] == "customer"

    def test_update_unknown_user_404(self, admin_sess):
        r = admin_sess.put(f"{BASE_URL}/api/admin/users/does-not-exist",
                           json={"name": "x"})
        assert r.status_code == 404

    def test_non_admin_cannot_update(self, customer):
        cust_sess, uid = customer
        r = cust_sess.put(f"{BASE_URL}/api/admin/users/{uid}", json={"name": "X"})
        assert r.status_code == 403


# ---------- D) Admin update partner ----------
class TestAdminUpdatePartner:
    def test_update_partner_fields_persist(self, admin_sess, partner):
        _, uid = partner
        r = admin_sess.put(f"{BASE_URL}/api/admin/partners/{uid}", json={
            "full_name": "Edited Partner",
            "phone": "7777777777",
            "city": "Pune",
            "area": "Kothrud",
            "experience_years": 7,
            "service_category": "Electrician",
            "bank_account": "1234567890",
            "ifsc": "SBIN0000001",
            "upi_id": "edited@upi",
            "online": True,
        })
        assert r.status_code == 200
        assert r.json() == {"ok": True}
        # verify via admin user detail
        g = admin_sess.get(f"{BASE_URL}/api/admin/users/{uid}").json()
        p = g["partner"]
        assert p["full_name"] == "Edited Partner"
        assert p["phone"] == "7777777777"
        assert p["city"] == "Pune"
        assert p["service_category"] == "Electrician"
        assert p["upi_id"] == "edited@upi"
        assert p["online"] is True

    def test_unknown_partner_404(self, admin_sess):
        r = admin_sess.put(f"{BASE_URL}/api/admin/partners/no-such-uid",
                           json={"full_name": "X"})
        assert r.status_code == 404

    def test_non_admin_forbidden(self, customer, partner):
        cust_sess, _ = customer
        _, puid = partner
        r = cust_sess.put(f"{BASE_URL}/api/admin/partners/{puid}", json={"full_name": "X"})
        assert r.status_code == 403


# ---------- E) Admin mark payment paid/unpaid ----------
class TestAdminPayment:
    def test_mark_paid_sets_fields_and_notifies(self, admin_sess, customer, booking_id):
        cust_sess, cuid = customer
        r = admin_sess.post(f"{BASE_URL}/api/admin/bookings/{booking_id}/payment", json={
            "action": "mark_paid", "payment_method": "upi", "payment_ref": "UPI-REF-001"
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["payment_status"] == "paid"
        assert body["payment_method"] == "upi"
        assert body["payment_ref"] == "UPI-REF-001"
        assert body["paid_at"]  # truthy iso string
        # GET also reflects
        g = cust_sess.get(f"{BASE_URL}/api/bookings/{booking_id}").json()
        assert g["payment_status"] == "paid"
        assert g["payment_ref"] == "UPI-REF-001"
        # Notification was sent to customer
        notifs = cust_sess.get(f"{BASE_URL}/api/notifications").json()
        assert any(n.get("booking_id") == booking_id and "Payment" in n.get("title", "")
                   for n in notifs)

    def test_mark_unpaid_resets(self, admin_sess, customer, booking_id):
        r = admin_sess.post(f"{BASE_URL}/api/admin/bookings/{booking_id}/payment",
                            json={"action": "mark_unpaid"})
        assert r.status_code == 200
        body = r.json()
        assert body["payment_status"] == "unpaid"
        assert body.get("payment_ref", "") in ("", None)
        assert body.get("paid_at") in (None, "")
        # Verify via customer GET
        cust_sess, _ = customer
        g = cust_sess.get(f"{BASE_URL}/api/bookings/{booking_id}").json()
        assert g["payment_status"] == "unpaid"

    def test_invalid_action_400(self, admin_sess, booking_id):
        r = admin_sess.post(f"{BASE_URL}/api/admin/bookings/{booking_id}/payment",
                            json={"action": "garbage"})
        assert r.status_code == 400

    def test_unknown_booking_404(self, admin_sess):
        r = admin_sess.post(f"{BASE_URL}/api/admin/bookings/nope/payment",
                            json={"action": "mark_paid"})
        assert r.status_code == 404

    def test_non_admin_cannot_mark(self, customer, booking_id):
        cust_sess, _ = customer
        r = cust_sess.post(f"{BASE_URL}/api/admin/bookings/{booking_id}/payment",
                           json={"action": "mark_paid"})
        assert r.status_code == 403
