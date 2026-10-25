/**
 * One-off, idempotent data migration for the event-publishing / registration upgrade.
 *
 *   npm run db:migrate
 *
 * What it does (and ONLY this — nothing is deleted or rewritten):
 *   1. Events created before the `published` flag existed get `published: true`,
 *      so every event that is visible today stays visible after the upgrade.
 *      (Application code also treats a missing flag as published, so this is
 *      belt-and-braces; new events default to drafts.)
 *   2. Reports teams whose competitionId / leaderId are stored as strings rather
 *      than ObjectIds. These are legacy documents; they are only REPORTED, never
 *      modified, because rewriting ids is a decision for the data owner.
 *
 * Safe to run any number of times. Run `npm run db:indexes` afterwards to create
 * the new indexes.
 */
import { getDB } from '../lib/db'

async function main() {
  const db = await getDB()
  console.log(`\nMigrating '${db.databaseName}'...\n`)

  const events = await db
    .collection('events')
    .updateMany({ published: { $exists: false } }, { $set: { published: true } })
  console.log(`  ✓ events: marked ${events.modifiedCount} legacy event(s) as published`)

  const legacyTeams = await db.collection('teams').countDocuments({
    $or: [{ competitionId: { $type: 'string' } }, { leaderId: { $type: 'string' } }],
  })
  if (legacyTeams > 0) {
    console.log(
      `  ! teams: ${legacyTeams} team(s) store competitionId/leaderId as strings (legacy). ` +
        'They keep working for reads but are not covered by the one-team-per-competition index. ' +
        'Review them manually.',
    )
  } else {
    console.log('  ✓ teams: no legacy string ids found')
  }

  console.log('\nDone.\n')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
