# Hasi Crochet Admin — Deployment Guide

## Stack
- **Frontend:** React + Vite (this repo)
- **Database:** Firebase Firestore (shared with mobile app)
- **Image Storage:** Firebase Storage
- **Hosting:** Vercel

---

## 1. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `hasi-crochet-prod`
3. Enable **Firestore Database** (start in production mode)
4. Enable **Storage** (for product images)
5. Go to **Project Settings → General → Your apps → Add app → Web**
6. Copy the config values — you will need them as env vars

### Firestore Collections

Create these collections (the app reads/writes to them):

| Collection  | Documents                                                      |
|-------------|----------------------------------------------------------------|
| `products`  | `id, name, category, price, stock, image, colors[], description, rating, reviews, active, createdAt` |
| `orders`    | `id, customer, email, phone, address, items[], total, status, date` |
| `messages`  | `id, customer, avatar, messages[], unread, time, preview`       |
| `settings`  | Single doc `store` with store config                           |

### Firestore Security Rules (Admin panel — server-side auth recommended)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 2. Wire Firebase into the App

Install the SDK:
```bash
npm install firebase
```

Create `src/lib/firebase.ts`:
```ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);
export const storage = getStorage(app);
```

Replace each mock data section in `App.tsx` with Firestore calls, e.g.:

```ts
// Load products
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

useEffect(() => {
  const unsub = onSnapshot(collection(db, "products"), snap => {
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
  });
  return unsub;
}, []);

// Save product
import { doc, setDoc, addDoc } from "firebase/firestore";

async function saveProduct(data: Partial<Product>) {
  if (isEdit) {
    await setDoc(doc(db, "products", data.id!), data, { merge: true });
  } else {
    await addDoc(collection(db, "products"), data);
  }
}

// Update order status
import { doc, updateDoc } from "firebase/firestore";

async function updateStatus(id: string, status: OrderStatus) {
  await updateDoc(doc(db, "orders", id), { status });
}
```

---

## 3. Upload Product Images to Firebase Storage

```ts
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";

async function uploadImage(file: File): Promise<string> {
  const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
```

In the `ProductModal`, replace the image URL input with a file input that calls `uploadImage` and stores the returned URL.

---

## 4. Deploy to Vercel

### Option A — Vercel CLI (recommended)

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option B — GitHub Integration

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the GitHub repo
4. Vercel auto-detects Vite — no build config needed

### Environment Variables

In **Vercel Dashboard → Project → Settings → Environment Variables**, add:

| Variable                          | Value (from Firebase config)     |
|-----------------------------------|----------------------------------|
| `VITE_FIREBASE_API_KEY`           | your `apiKey`                    |
| `VITE_FIREBASE_AUTH_DOMAIN`       | your `authDomain`                |
| `VITE_FIREBASE_PROJECT_ID`        | your `projectId`                 |
| `VITE_FIREBASE_STORAGE_BUCKET`    | your `storageBucket`             |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | your `messagingSenderId`       |
| `VITE_FIREBASE_APP_ID`            | your `appId`                     |

---

## 5. Optional: Vercel KV for Sessions / Cache

If you want to add admin auth sessions or rate limiting without Firebase Auth:

```bash
vercel kv create hasi-sessions
```

Add a `api/auth.ts` serverless function:
```ts
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const token = req.headers["x-admin-token"];
  const valid = await kv.get(`session:${token}`);
  if (!valid) return res.status(401).json({ error: "Unauthorized" });
  res.json({ ok: true });
}
```

Install: `npm install @vercel/kv`

---

## 6. Custom Domain

In **Vercel Dashboard → Project → Settings → Domains**:
- Add `admin.hasicrochet.com` or `hasicrochet.com/admin`
- Point your DNS CNAME to `cname.vercel-dns.com`

---

## Summary

```
Firebase Firestore  ──▶  products, orders, messages (real-time)
Firebase Storage    ──▶  product images
Vercel              ──▶  hosts the React admin SPA
Vercel KV (opt.)    ──▶  admin session tokens
```

The mobile app (Flutter/React) reads from the same Firestore collections — any product you add or order status you update in this admin panel is instantly reflected in the customer app.
