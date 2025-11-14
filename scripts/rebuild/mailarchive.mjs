import Typesense from 'typesense'
import _ from 'lodash-es'
import postgres from 'postgres'
import { DateTime } from 'luxon'
import fs from 'node:fs/promises'
import PostalMime from 'postal-mime'

import mlSchema from '../../schemas/mailarchive.mjs'

async function main () {
  // Connect to DB
  const sql = postgres(process.env.MAILARCHIVE_DB_CONNSTR, {
    ssl: 'prefer'
  })

  // Typesense Client

  const ts = new Typesense.Client({
    'nodes': [{
      'host': 'typesense.ietf.org',
      'port': '443',
      'protocol': 'https'
    }],
    'apiKey': process.env.TYPESENSE_API_KEY,
    'connectionTimeoutSeconds': 300
  })

  // Re-create collection

  try {
    await ts.collections('mailarchive').delete()
  } catch (err) {
    console.warn(err.message)
  }
  await ts.collections().create(mlSchema)

  // Get all messages

  let idx = 0
  await sql`
    SELECT
      msg.*,
      list.name AS listname
    FROM archive_message msg
    LEFT JOIN archive_emaillist list ON (msg.email_list_id = list.id)
    LIMIT 1000
  `.cursor(100, async rows => {
    console.info(`Importing chunk ${idx * 100}-${(idx + 1) * 100}...`)
    const items = []

    for (const r of rows) {
      // Fetch message content
      let content = ''
      try {
        const contentBuffer = await fs.readFile(`/mnt/mailarchive/data/archive/${r.listname}/${r.hashcode}`)
        const email = await PostalMime.parse(contentBuffer)
        content = email.text
      } catch (err) {
        console.warn(`Failed to fetch message content for ${r.hashcode}`)
      }

      // -> Add to collection
      items.push({
        id: r.hashcode,
        subject: r.base_subject,
        from: r.frm,
        to: r.to,
        content,
        list: r.listname,
        date: r.date ? DateTime.fromJSDate(r.date).toUnixInteger() : 0
      })
    }

    await ts.collections('mailarchive').documents().import(items, { action: 'create', batch_size: 100 })
    idx++
  })

  await sql.end()
}

main()
