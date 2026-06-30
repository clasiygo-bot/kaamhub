# KaamHub V1.0 — Product Requirements

**Tagline:** Har Kaam, Ab Hoga Aasaan!  
**Brand:** Navy #0F2D5C · Orange #FF8A00 · White background  
**Stack:** FastAPI + MongoDB + React (single web app, 3 surfaces under one origin)

## Original problem statement
Build a production-ready Home Services Platform (Customer + Partner + Admin) with splash screen, location-based home, service catalogue, multi-step booking, partner onboarding + KYC, partner dashboard with wallet & withdrawals, admin dashboard for verification/bookings/payouts/services/offers/users. Premium Urban-Company-inspired design.

## User personas
1. **Customer** — needs services at home, books and pays after work.
2. **Partner** — service professional, submits KYC, accepts bookings, earns + withdraws.
3. **Admin** — verifies partners, manages catalogue, bookings, payouts.

## Architecture
- **Backend** `/app/backend/server.py` — FastAPI with `/api` prefix, JWT cookies (`access_token`, `refresh_token`), bcrypt, MongoDB via Motor, uuid string IDs.
- **Frontend** `/app/frontend/src/*` — React 19 + Tailwind + Shadcn UI + framer-motion + lucide-react. Auth via httpOnly cookies + axios `withCredentials`. BrowserRouter with role-based `ProtectedRoute`.
- **Seeded data**: 5 categories, 10 services, 2 offers, 1 admin user on first startup.

## What's implemented (Feb 2026)
### Auth
- `POST /api/auth/register` (role=customer|partner) auto-issues cookies + creates partner stub
- `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me`
- Admin seeded from env (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) on startup

### Customer
- Splash screen (2s) → role-aware redirect
- Landing page (anonymous): hero, services grid, CTAs
- Home: location detect, search, offers, category chips, service grid, recent bookings
- Service detail → 4-step booking wizard (Address → Date/Time → Notes → Review)
- Bookings list + detail with live status timeline + cancel + rating after completion
- Notifications drawer · Profile

### Partner
- Status gate (incomplete/pending/rejected/approved)
- Onboarding form (personal + work + Aadhaar/PAN/selfie URLs + bank/UPI)
- Dashboard: online toggle, KPI bento (jobs, completed, wallet, rating), open requests near you
- Jobs list with state-machine advance (accepted → on_the_way → started → completed)
- Wallet with withdrawal request + history

### Admin
- KPI dashboard (8 metrics)
- Verifications: approve/reject with reason
- Bookings: table with filters, assign partner
- Payouts: approve, mark-paid with UTR, reject (refunds wallet)
- Services: create/toggle/delete
- Offers: create/delete
- Users: filter by role, toggle active, delete

## Backlog (P0/P1/P2)
- **P1**: Live partner tracking map (Leaflet/OSM) on booking-in-progress
- **P1**: Image upload via object storage (currently URL paste)
- **P1**: Razorpay/Stripe payment integration (currently no payment collection)
- **P2**: Enforce booking-status state-machine on backend (skipping steps allowed today)
- **P2**: Brute-force account lockout (5 failed → 15min)
- **P2**: Real-time push via WebSocket / FCM (currently polled every 6s on booking detail)
- **P2**: Saved addresses, multiple addresses per customer
- **P2**: Promo-code validation at checkout
- **P2**: Refactor `server.py` (895 lines) into routers/

## Next tasks
1. Add real hero photography (replace gradient placeholder)
2. Hook up Leaflet for live partner tracking
3. Object storage for KYC document uploads
4. Razorpay integration for payments
