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
git clone https://github.com/code128/ingredient-shopper.git
cd ingredient-shopper
```

### 2. Install dependencies
Note: You'll need node installed (if you don't have it, you can get it from https://nodejs.org/ or just ask your agent to help you get started.)
```bash
npm install
```

### 3. Environment Setup
You'll need several API keys to run the stack. Rename `.env.example` to `.env` (or create one) and insert your own variable strings:
```env
# Postgres Database (Neon.tech) You can run this locally too
DATABASE_URL="postgresql://user:pass@ep-host.region.aws.neon.tech/neondb"

# Google Gemini API 
# This is what does the heavy lifting of finding and categorizing ingredients from the recipe text or image
GEMINI_API_KEY="your_google_ai_studio_key"

# NextAuth Configuration
AUTH_SECRET="generate_a_random_32_char_hex_string"

# Resend Magic Links https://resend.com/signup (you could replace this with an Oauth provider)
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
#### App focused
- **Shared Lists:** Modify the Prisma Schema so multiple `User` accounts can join a shared `Household` list.
- **Quantity Conversion:** Write typescript utility functions to consolidate differing units (e.g. converting 1 tbsp + 1 cup into a singular metric block in the UI wrapper).
- **Dark/Light Mode toggling:** Introduce `next-themes` and rework the CSS `:root` variables to toggle back to our previous Glassmorphism CSS dynamically.
#### AI / Architecture focused
- **Change the Auth Provider or create your own:** Switch to google oauth, or another provider. Create your own authentication system, use firebase auth etc. 
- **Change the Database:** Switch to a different database, for example, Supabase, or MongoDB, Cloud SQL, or something else entirely.
- **Change the AI Provider:** Switch to a different AI provider, for example, OpenAI, or Anthropic.
- **Change the PWA Framework:** Switch to a different PWA framework, for example, Workbox.
#### Hosting focused
- **Change the Hosting Provider:** Switch to a different hosting provider, for example, Netlify, AWS, GCP, Azure or something else entirely.
- **Change the Deployment Strategy:** Switch to a different deployment strategy, for example, Docker, Terraform, etc
#### UI / UX focused
- **Change the UI Framework:** Switch to a different UI framework, for example, Tailwind CSS.
- **Change the Animation Library:** Switch to a different animation library, for example, GSAP.
---

### Initial Prompt used to create this app if you want to retry with a different AI partner
> 🧑 **User:** 
>I want to build a recipe ingredient shopping list application. Users should be able to upload recipes, whether they're screenshots or URL links to a recipe page. The app should read the recipe, save it to a database, and then search for all the ingredients needed for that recipe.

>The app is geared towards people who are planning their week of meals and shopping for them. So, if you have five recipes linked and set up, the application will scan all the ingredients for those five recipes, deduplicate them, add up all the necessary ingredients, and then create a shopping list. The shopping list will be grouped by type of ingredient, so all spices are together, all vegetables are together, all frozen items, all meats, and all cheeses.

>Additional extra points: if the order of the ingredient list were to match the store layout you're going through. So, if you know the Trader Joe's you're shopping in and we could figure out its interior layout, the listing could start with, for example, vegetables, and help you have a path through the store.

>As you build up a recipe collection, you should be able to turn recipes on and off, which will turn their related ingredients on and off. So, if you have ten recipes but only select five, the ingredient list will only be for those five. Additionally, each ingredient listing should have a reference or a little visual indicator of which recipe it comes from. It would have multiple indicators if it's from multiple recipes.

>The app should also have a shopping mode. When you're in shopping mode and you tap an ingredient, it will check it off so you know you've picked it up and it's in your cart. I think that's it.

Note this doesn't cover user accounts, editing, mobile optimizations, visual styles and other items that were all added later through conversation with Jetski/Antigravity.
