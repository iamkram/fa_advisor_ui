import mysql from 'mysql2/promise';
import fs from 'fs';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const sql = fs.readFileSync('drizzle/migrations/0002_add_hierarchy.sql', 'utf8');
const statements = sql.split(';').filter(s => s.trim());

for (const stmt of statements) {
  if (stmt.trim()) {
    try {
      await conn.query(stmt);
      console.log('✓ Executed:', stmt.substring(0, 60) + '...');
    } catch (err) {
      if (!err.message.includes('Duplicate') && !err.message.includes('duplicate')) {
        console.error('✗ Error:', err.message.substring(0, 100));
      }
    }
  }
}

await conn.end();
console.log('\n✓ Migration complete!');
