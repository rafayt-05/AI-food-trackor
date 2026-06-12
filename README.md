# Food Wastage Donation System — Prototype

A simple, client-side web app to connect food donors with nearby NGOs, reducing food waste.

## Features

- **User Registration & Login** — Donors/restaurants register with name, email, password, and role (Donor/NGO)
- **Home Page** — Welcome splash
- **Dashboard** — Authenticated donors can:
  - Create food offers (item, quantity, pickup instructions, location, expiry, photo)
  - Manage their offers (view, remove)
  - Get location via geolocation API or manual entry
- **NGO Suggestions** — When an offer includes location, suggests closest NGOs by distance (Haversine)
- **About & FAQ** — Static info pages
- **Responsive Design** — Works on desktop and mobile

## Tech Stack

- Pure HTML5, CSS3, JavaScript (no dependencies)
- Local Storage for users, offers, NGOs
- Geolocation API (optional, fallback to manual lat/lon)

## Quick Start

1. Open `index.html` in a modern browser
2. Click **Register** to create an account (email must be unique)
3. Click **Login** with your credentials
4. On the **Dashboard**, fill the form and click **Create Offer**
5. If you provide location, the app will suggest nearby NGOs

## Sample Login

- Email: `test@example.com`
- Password: `test123`

Register this first from the Register page.

## Data Structure

### Users
```json
{
  "id": "unique_id",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "plaintext_pass",
  "role": "donor" // or "ngo"
}
```

### Offers
```json
{
  "id": "unique_id",
  "userId": "owner_user_id",
  "itemName": "Cooked Rice",
  "quantity": 10,
  "pickup": "Main entrance, side door",
  "lat": 28.6139,
  "lon": 77.2090,
  "expiry": "2026-06-11T18:00",
  "photo": "https://...",
  "createdAt": 1720000000000
}
```

### NGOs (Fixtures)
```json
{
  "id": "ngo1",
  "name": "Helping Hands",
  "lat": 28.6139,
  "lon": 77.2090,
  "contact": "+911234567890"
}
```

## How NGO Suggestions Work

When an offer is created with latitude/longitude, the app calculates the distance to all NGOs using the Haversine formula and displays the 5 closest ones with distance in km.

## Limitations (Prototype)

- **No backend**: All data stored in browser localStorage only
- **Passwords in plaintext**: For demo purposes only
- **No NGO verification**: Sample NGOs are hardcoded fixtures
- **No payment/messaging**: Just suggestions
- **Single browser persistence**: Data doesn't sync across devices

## Next Steps (Production)

1. Replace localStorage with backend API (Node.js, Django, etc.)
2. Implement proper authentication (JWT, OAuth)
3. Add real NGO database with verification
4. Add messaging/chat between donors and NGOs
5. Integrate real maps (Google Maps, Mapbox)
6. Add image upload instead of URL-only
7. Implement notifications & reminders
8. Add reviews & ratings

## File Structure

```
AI FOOD TRACKER/
├── index.html      # Main SPA markup (pages, forms, nav)
├── styles.css      # Responsive styles
├── app.js          # SPA logic, auth, offers, NGO suggestions
└── README.md       # This file
```

---

**Note:** This is a functional prototype to demonstrate the concept. It is NOT production-ready.
