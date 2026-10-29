# KFC — Chicken Man Plug

Mobile-first food ordering storefront for KFC and Pizzaman Chickenman menu browsing, mixed carts, and WhatsApp checkout.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Current vertical slice

- Responsive storefront with KFC and Chickenman menu tabs
- Menu search and product cards
- Mixed-restaurant cart with quantity controls
- Checkout validation for name, phone, area, and address
- WhatsApp Click-to-Chat handoff to `0501242319` using international format
- Clear reminder that the customer must press Send in WhatsApp

## Production follow-up

The visible menu is demo content for the first UI slice. Before launch, replace it with an authorized database-backed catalog and add Supabase Auth/RLS, admin product management, image storage, server-side checkout revalidation, order persistence, rate limiting, and real delivery-zone configuration. Do not publish demo prices or imagery as official restaurant content without authorization.
