import Typesense from 'typesense'
import _ from 'lodash-es'
import postgres from 'postgres'
import { DateTime } from 'luxon'

import docsSchema from '../../schemas/docs.mjs'

async function main () {
  // Connect to DB
  const sql = postgres(process.env.DATATRACKER_DB_CONNSTR, {
    ssl: 'prefer',
    connection: {
      search_path: 'datatracker'
    }
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
    await ts.collections('docs').delete()
  } catch (err) {
    console.warn(err.message)
  }
  await ts.collections().create(docsSchema)

  // Get subseries count

  const subseriesCountResult = await sql`
    SELECT
      doc.name,
      (SELECT COUNT(*) FROM doc_relateddocument AS drd WHERE drd.source_id = doc.id AND drd.relationship_id = 'contains') AS ct
    FROM doc_document AS doc
    WHERE type_id = 'bcp' OR type_id = 'std' OR type_id = 'fyi'
    ORDER BY name ASC
  `
  const subseriesCount = subseriesCountResult.reduce((acc, cur) => {
    acc[cur.name] = parseInt(cur.ct)
    return acc
  }, {})

  // Query all RFCs

  let idx = 0
  await sql`
    SELECT
      doc.*,
      grp.acronym AS groupacronym,
      grp.name AS groupname,
      grpar.acronym AS areaacronym,
      grpar.name AS areaname,
      p.name AS adName,
      sln.name AS stdlevelname,
      stn.name AS streamname,
      docev.time AS publicationdate,
      array(
        SELECT ARRAY[ds.slug, ds.name, ds.type_id]
        FROM doc_document_states dds
        LEFT JOIN doc_state ds on dds.state_id = ds.id
        WHERE dds.document_id = doc.id AND ds.type_id = 'rfc'
      ) AS states,
      array(
        SELECT ARRAY[pp.name, da.affiliation]
        FROM doc_documentauthor da
        LEFT JOIN person_person pp on da.person_id = pp.id
        WHERE da.document_id = doc.id
        ORDER BY da."order"
      ) AS authors,
      array(
        SELECT ARRAY[ddrd.type_id, ddrd.name]
        FROM doc_relateddocument drd
        LEFT JOIN doc_document ddrd ON drd.source_id = ddrd.id
        WHERE drd.target_id = doc.id AND drd.relationship_id = 'contains' AND (ddrd.type_id = 'bcp' OR ddrd.type_id = 'std' OR ddrd.type_id = 'fyi')
      ) as subseries,
      array(
        SELECT ARRAY[flagdrd.relationship_id, flagddrd.rfc_number::text]
        FROM doc_relateddocument flagdrd
        LEFT JOIN doc_document flagddrd ON flagdrd.source_id = flagddrd.id
        WHERE flagdrd.target_id = doc.id AND (flagdrd.relationship_id = 'obs' OR flagdrd.relationship_id = 'updates')
      ) as flags
    FROM doc_document doc
    LEFT JOIN group_group grp ON (doc.group_id = grp.id)
    LEFT JOIN group_group grpar ON (grp.parent_id = grpar.id)
    LEFT JOIN person_person p ON (doc.ad_id = p.id)
    LEFT JOIN name_stdlevelname sln ON (doc.std_level_id = sln.slug)
    LEFT JOIN name_streamname stn ON (doc.stream_id = stn.slug)
    LEFT JOIN doc_docevent docev ON (doc.id = docev.doc_id AND docev.type = 'published_rfc')
    WHERE doc.type_id = 'rfc'
  `.cursor(100, async rows => {
    console.info(`Importing chunk ${idx * 100}-${(idx + 1) * 100}...`)
    const docs = []

    for (const r of rows) {
      if (r.groupacronym === 'none') {
        r.areaacronym = null
        r.areaname = null
      }

      // -> Subseries
      const subseries = {}
      if (r.subseries?.length) {
        for (const subserie of r.subseries) {
          switch (subserie[0]) {
            case 'bcp':
              subseries.bcp = subserie[1].substring(3)
              break
            case 'std':
              subseries.std = subserie[1].substring(3)
              break
            case 'fyi':
              subseries.fyi = subserie[1].substring(3)
              break
          }
          subseries.total = subseriesCount[subserie[1]] || 1
        }
      }

      // -> Flags
      const flags = {
        obsoleted: false,
        updated: false
      }
      const obsoletedBy = []
      const updatedBy = []

      if (r.flags?.length) {
        for (const flag of r.flags) {
          if (flag[0] === 'obs') {
            flags.obsoleted = true
            obsoletedBy.push(flag[1])
          } else if (flag[0] === 'updates') {
            flags.updated = true
            updatedBy.push(flag[1])
          }
        }
      }

      // -> Format content
      let content
      try {
        const resp = await fetch(`https://www.rfc-editor.org/rfc/rfc${r.rfc_number}.txt`)
        if (resp.ok) {
          content = (await resp.text()).trim().replaceAll(/\. |! /g, ' ').replaceAll(/<--|-->|--+|\+|\.\.+/g, '').replaceAll(/\[[a-z0-9 -]+\]/gi, '').replaceAll(/[0-9]+\.[0-9]+(\.[0-9]+)?/gi, '').replace(/\s+/g, ' ')
        }
      } catch (err) {
        console.warn(`Failed to fetch ${r.rfc_number}: ${err.message}`)
      }

      // -> Add to collection
      docs.push({
        id: `doc-${r.id}`,
        ...r.rfc_number && { rfcNumber: _.toSafeInteger(r.rfc_number), rfc: r.rfc_number.toString() },
        ...r.ref && { ref: r.ref },
        title: r.title?.trim() ?? r.name ?? '',
        filename: r.name ?? '',
        abstract: r.abstract?.replace(/(?:\r\n|\r|\n)/g, ' ').trim().replaceAll(/\s\s+/g, ' ') ?? '',
        keywords: (r.keywords || []).map(a => a.trim()).filter(a => a),
        pages: _.toSafeInteger(r.pages) || 0,
        date: r.time ? DateTime.fromJSDate(r.time).toUnixInteger() : 0,
        ...r.expires && { expires: DateTime.fromJSDate(r.expires).toUnixInteger() },
        ...r.publicationdate && { publicationDate: DateTime.fromJSDate(r.publicationdate).toUnixInteger() },
        ...r.groupacronym && { group: { acronym: r.groupacronym, name: r.groupname, full: `${r.groupacronym} - ${r.groupname}` } },
        ...r.areaacronym && !['ISE', 'IAB', 'IRTF'].includes(r.streamname) && { area: { acronym: r.areaacronym, name: r.areaname, full: `${r.areaacronym} - ${r.areaname}` } },
        keywords: [],
        type: r.type_id,
        state: r.states?.map(s => s[1]) ?? [],
        subseries,
        ...r.stdlevelname && { status: { slug: r.std_level_id, name: r.stdlevelname } },
        ...r.streamname && { stream: { name: r.streamname, slug: r.stream_id } },
        ...r.authors.length > 0 && {
          authors: r.authors.map(a => ({
            name: a[0],
            affiliation: a[1]
          }))
        },
        ...r.adname && { adName: r.adname },
        flags,
        ...obsoletedBy.length > 0 && { obsoletedBy },
        ...updatedBy.length > 0 && { updatedBy },
        ...content && { content },
        ranking: r.type_id === 'rfc' ? _.toSafeInteger(r.rfc_number) : (_.toSafeInteger(r.rev) || 0)
      })
    }
    await ts.collections('docs').documents().import(docs, { action: 'create', batch_size: 100 })
    idx++
  })

  await sql.end()
}

main()
