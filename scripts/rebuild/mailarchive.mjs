import Typesense from 'typesense'
import _ from 'lodash-es'
import postgres from 'postgres'
import { DateTime } from 'luxon'
import fs from 'node:fs/promises'
import { setTimeout } from 'node:timers/promises'

import mlSchema from '../../schemas/mailarchive.mjs'

async function main () {
  // Connect to DB
  // const sql = postgres(process.env.MAILARCHIVE_DB_CONNSTR, {
  //   ssl: 'prefer'
  // })

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

  // Get mailing lists

  console.info('beep boop')
  await setTimeout(1000 * 60 * 60)

  // await sql.end()
}

main()
