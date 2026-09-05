# VASAW AI — Deployment Guide

## Production Deployment on Vercel

1. **Connect GitHub Repository** to Vercel.
2. **Framework Preset**: Next.js (Automatic).
3. **Environment Variables**: Configure variables from `.env.example` in Vercel Project Settings.
4. **Build Command**: `npm run build`
5. **Output Directory**: `.next`

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Run development server
npm run dev
```
