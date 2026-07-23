-- =============================================
-- SQL Schema for Analog Disposable Cam
-- Generated from prisma/schema.prisma
-- Run this on your new Supabase SQL Editor
-- =============================================

-- Enable UUID extension (biasanya sudah aktif di Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== TABLE: Photo ==========
CREATE TABLE IF NOT EXISTS "Photo" (
    "id"          TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "username"    TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "finalUrl"    TEXT NOT NULL,
    "filterName"  TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ========== TABLE: CubeFilter ==========
CREATE TABLE IF NOT EXISTS "CubeFilter" (
    "id"        TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "name"      TEXT NOT NULL,
    "emoji"     TEXT NOT NULL DEFAULT '🎨',
    "fileName"  TEXT NOT NULL,
    "cloudUrl"  TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint on fileName (prevent duplicate cube uploads)
CREATE UNIQUE INDEX IF NOT EXISTS "CubeFilter_fileName_key" ON "CubeFilter"("fileName");

-- ========== DONE ==========
-- Setelah run SQL ini, update .env dengan URL Supabase baru:
--
--   DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
--   DIRECT_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
--
-- Lalu jalankan: npx prisma generate
