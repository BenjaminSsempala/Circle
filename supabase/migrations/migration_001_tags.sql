-- ============================================================
-- Migration 001: Add tags column to artists table
-- Run in Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE artists ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
