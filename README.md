# Ingredient Shopper 🛒

A highly polished, AI-powered Progressive Web Application (PWA) designed to seamlessly extract raw recipes from any URL or image and aggregate them into a smart, categorized grocery shopping list. 

Built as a learning platform, this repository demonstrates cutting-edge modern web development architecture utilizing Next.js 16, Google Gemini AI, Vercel Edge networks, Framer Motion physics, and Serverless Postgres (Neon.tech).

## 🌟 What is it for?
Have you ever stared at 5 different recipe tabs, trying to figure out if you need 2 onions or 4 onions total for the week? 

**Ingredient Shopper solves this.**
1. **Paste a Link / Upload an Image:** Feed the app a messy food blog link or a photo of a cookbook page.
2. **AI Extraction:** Cheerio strips the useless DOM layer, and Google Gemini extracts, normalizes, and categorizes the core ingredients.
3. **Smart Aggregation:** The app combines quantities (e.g., 1 onion + 1 onion = 2 onions) and sorts everything by supermarket aisles (Produce, Dairy, Pantry) to save you time.
4. **Offline Mode:** Because supermarkets are giant Faraday cages that block cell reception, this app installs natively to your iPhone/Android Home Screen as a PWA and runs perfectly offline!

## 🧩 How does it work? (Architecture)
Instead of relying on rigid, hardcoded scraping tools, this app leverages **Generative AI** for data normalization. 
- **Frontend Layer:** React 19 / Next.js 16 (App Router) styling driven by a custom 'Neon Dark' aesthetic with `framer-motion` for buttery 60fps micro-interactions.
- **Backend APIs:** Next.js Server Components and serverless API endpoints execute strict Type-Safe database operations via Prisma's ORM.
- **Database:** Hosted on `Neon.tech`—a serverless Postgres environment perfect for Next.js architectures that scale to zero.
- **Authentication:** Passwordless "Magic Links" powered by Auth.js and Resend, wiping out the need to manage user passwords.
- **PWA Framework:** Service Workers managed by `@serwist/next` aggressively cache the UI structure, allowing the app to render quickly without Wi-Fi.

## 🚀 Cloning & Learning (Getting Started)

Want to deploy it yourself or use the codebase to learn Next.js App Router patterns? Run the following commands:

### 1. Clone the repository
```bash
git clone https://github.com/your-username/ingredient-shopper.git
cd ingredient-shopper
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
You'll need several API keys to run the stack. Rename `.env.example` to `.env` (or create one) and insert your own variable strings:
```env
# Serverless Database (Neon.tech)
DATABASE_URL="postgresql://user:pass@ep-host.region.aws.neon.tech/neondb"

# Google Gemini API
GEMINI_API_KEY="your_google_ai_studio_key"

# NextAuth Configuration
AUTH_SECRET="generate_a_random_32_char_hex_string"

# Resend Magic Links
AUTH_RESEND_KEY="re_123456789"
EMAIL_FROM="shopping-list@yourdomain.com"
```

### 4. Database Seeding & Schema Push
Initialize the Prisma Client and feed your remote serverless database some default test recipes:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the app!

### 💡 Suggested Learning Exercises
If you are using this codebase to learn React and modern JavaScript architectures, try tackling these feature challenges on your own:
- **Shared Lists:** Modify the Prisma Schema so multiple `User` accounts can join a shared `Household` list.
- **Quantity Conversion:** Write typescript utility functions to consolidate differing units (e.g. converting 1 tbsp + 1 cup into a singular metric block in the UI wrapper).
- **Dark/Light Mode toggling:** Introduce `next-themes` and rework the CSS `:root` variables to toggle back to our previous Glassmorphism CSS dynamically.
