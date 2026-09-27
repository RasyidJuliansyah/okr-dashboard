#!/usr/bin/env bash
set -e

BACKUP_FILE="backup/backup_original_before_demo.sql"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: File backup $BACKUP_FILE tidak ditemukan!"
  exit 1
fi

echo "Memulihkan database skolla_okr ke kondisi awal sebelum demo..."
mysql -u root -ppassword -h 127.0.0.1 -P 3307 skolla_okr < "$BACKUP_FILE"

echo "✅ Berhasil! Database skolla_okr telah dikembalikan 100% ke kondisi semula."
