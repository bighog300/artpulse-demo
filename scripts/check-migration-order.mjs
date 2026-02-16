import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const migrationsDir = 'prisma/migrations'
const migrationFolders = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

const createdTables = new Set()
const errors = []

for (const folder of migrationFolders) {
  const sqlPath = join(migrationsDir, folder, 'migration.sql')
  const sql = readFileSync(sqlPath, 'utf8')
  const lines = sql.split(/\r?\n/)

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]

    const createMatch = line.match(/CREATE TABLE\s+"([^"]+)"/i)
    if (createMatch) {
      createdTables.add(createMatch[1])
    }

    const referenceMatches = [...line.matchAll(/REFERENCES\s+"([^"]+)"\s*\(/gi)]
    for (const match of referenceMatches) {
      const referencedTable = match[1]
      if (!createdTables.has(referencedTable)) {
        errors.push(`${folder}/migration.sql:${i + 1} references table "${referencedTable}" before it is created in migration order`)
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Migration ordering check failed:\n')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log(`Migration ordering check passed for ${migrationFolders.length} migration(s).`)
