import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const outputFile = path.join(__dirname, '../sqlite_to_mysql.sql');
  const sqlLines: string[] = [];

  sqlLines.push('-- Exported from SQLite to MySQL');
  sqlLines.push('SET FOREIGN_KEY_CHECKS = 0;');
  sqlLines.push('SET UNIQUE_CHECKS = 0;');
  sqlLines.push('');

  // Models to export
  const models = [
    { name: 'User', client: prisma.user },
    { name: 'Team', client: prisma.team },
    { name: 'Department', client: prisma.department },
    { name: 'Objective', client: prisma.objective },
    { name: 'AnnualKeyResult', client: prisma.annualKeyResult },
    { name: 'KeyResult', client: prisma.keyResult },
    { name: 'KrAssignment', client: prisma.krAssignment },
    { name: 'KrDepartment', client: prisma.krDepartment },
    { name: 'KrUpdate', client: prisma.krUpdate },
    { name: 'CausalLink', client: prisma.causalLink },
    { name: 'Initiative', client: prisma.initiative },
    { name: 'Task', client: prisma.task },
    { name: 'TaskAssignment', client: prisma.taskAssignment },
    { name: 'TaskUpdate', client: prisma.taskUpdate },
    { name: 'InitiativeUpdate', client: prisma.initiativeUpdate },
  ];

  for (const model of models) {
    console.log(`Fetching data for ${model.name}...`);
    let records: any[] = [];
    try {
      records = await (model.client as any).findMany();
    } catch (e: any) {
      console.warn(`Could not fetch data for ${model.name}: ${e.message}`);
      continue;
    }
    console.log(`Found ${records.length} records for ${model.name}.`);

    sqlLines.push(`-- Table: ${model.name}`);
    sqlLines.push(`DELETE FROM \`${model.name}\`;`);

    if (records.length === 0) {
      sqlLines.push('');
      continue;
    }

    const keys = Object.keys(records[0]);
    
    // Chunk records to prevent extremely large SQL statements
    const chunkSize = 100;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const valuesList = chunk.map((record: any) => {
        const values = keys.map(key => formatValue(record[key]));
        return `(${values.join(', ')})`;
      });

      const columnNames = keys.map(k => `\`${k}\``).join(', ');
      sqlLines.push(`INSERT INTO \`${model.name}\` (${columnNames}) VALUES\n${valuesList.join(',\n')};`);
    }
    sqlLines.push('');
  }

  sqlLines.push('SET FOREIGN_KEY_CHECKS = 1;');
  sqlLines.push('SET UNIQUE_CHECKS = 1;');
  sqlLines.push('');

  fs.writeFileSync(outputFile, sqlLines.join('\n'), 'utf8');
  console.log(`Successfully generated SQL file at: ${outputFile}`);
}

function escapeString(val: string): string {
  return val.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
    switch (char) {
      case "\0":
        return "\\0";
      case "\x08":
        return "\\b";
      case "\x09":
        return "\\t";
      case "\x1a":
        return "\\z";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case "\"":
      case "'":
      case "\\":
      case "%":
        return "\\" + char;
      default:
        return char;
    }
  });
}

function formatValue(val: any): string {
  if (val === null || val === undefined) {
    return 'NULL';
  }
  if (typeof val === 'boolean') {
    return val ? '1' : '0';
  }
  if (typeof val === 'number') {
    return val.toString();
  }
  if (val instanceof Date) {
    // MySQL format: YYYY-MM-DD HH:mm:ss.SSS
    const pad = (n: number, size = 2) => String(n).padStart(size, '0');
    const yyyy = val.getFullYear();
    const mm = pad(val.getMonth() + 1);
    const dd = pad(val.getDate());
    const hh = pad(val.getHours());
    const min = pad(val.getMinutes());
    const ss = pad(val.getSeconds());
    const ms = pad(val.getMilliseconds(), 3);
    return `'${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}.${ms}'`;
  }
  if (typeof val === 'string') {
    return `'${escapeString(val)}'`;
  }
  return `'${escapeString(JSON.stringify(val))}'`;
}

main()
  .catch(err => {
    console.error('Error during export:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
