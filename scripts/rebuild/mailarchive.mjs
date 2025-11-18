import Typesense from 'typesense'
import _ from 'lodash-es'
import postgres from 'postgres'
import { DateTime } from 'luxon'
import fs from 'node:fs/promises'
import PostalMime from 'postal-mime'
import { stripHtml } from 'string-strip-html'

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
  `.cursor(100, async rows => {
    console.info(`Importing chunk ${idx * 100}-${(idx + 1) * 100}...`)
    const items = []

    for (const r of rows) {
      // Parse email
      let content = ''
      let fromName = r.frm
      let fromEmail = ''
      try {
        const contentBuffer = await fs.readFile(`/mnt/mailarchive/data/archive/${r.listname}/${r.hashcode}`)
        const email = await PostalMime.parse(contentBuffer)

        // From
        fromName = email.from.name ?? r.frm,
        fromEmail = email.from.address ?? ''

        // Message content
        if (email.text) {
          content = email.text
        } else if (email.html) {
          content = stripHtml(email.html).result
        }
      } catch (err) {
        console.warn(`Failed to fetch message content for ${r.hashcode}`)
      }

      // -> Add to collection
      items.push({
        id: r.hashcode,
        subject: r.base_subject,
        fromName,
        fromEmail,
        to: r.to,
        content: content ?? '',
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
