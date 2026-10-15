#!/usr/bin/env bash
# Exports every table from the SQLite dev/prod database into JSON files,
# one file per table, ready to be imported into MySQL by import-mysql.ts.
#
# Usage: ./scripts/export-sqlite.sh [path-to-sqlite-file]
# Defaults to backend/src/prisma/dev.db if no path is given.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_PATH="${1:-$SCRIPT_DIR/../src/prisma/dev.db}"
OUT_DIR="$SCRIPT_DIR/migration-data"

if [ ! -f "$DB_PATH" ]; then
  echo "SQLite file not found: $DB_PATH" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

TABLES=(User Team Department Objective KeyResult KrAssignment KrDepartment KrUpdate CausalLink Initiative Kpi KpiAssignment KpiUpdate)

for TABLE in "${TABLES[@]}"; do
  echo "Exporting $TABLE..."
  sqlite3 -json "$DB_PATH" "SELECT * FROM \"$TABLE\";" > "$OUT_DIR/$TABLE.json"
  COUNT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$OUT_DIR/$TABLE.json','utf8') || '[]').length)")
  echo "  -> $COUNT rows"
done

echo ""
echo "Done. JSON files written to $OUT_DIR"
echo "Next: update DATABASE_URL to your MySQL connection string, run 'npx prisma migrate deploy' (or 'npx prisma db push'), then run scripts/import-mysql.ts"
