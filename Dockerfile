# KTI Struk Tol - image produksi untuk VPS (tanpa akun Vercel).
# Cetak tidak dilakukan di server; browser pengguna mengirim byte ESC/POS ke agen cetak
# lokal di PC-nya (public/agent). Server hanya merender struk + raster kepala (sharp).

# ---- Dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- Builder ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Runner ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Tidak perlu font sistem: teks raster kepala dirender dari font di repo (lib/struk/fonts, opentype.js).
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
