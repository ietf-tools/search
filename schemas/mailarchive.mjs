/**
 * Collection of mailarchive messages
 */
export default {
  name: 'mailarchive',
  enable_nested_fields: true,
  fields: [
    // Hashcode
    {
      name: 'hash',
      type: 'string',
      facet: false
    },
    // Subject (sanitzed)
    {
      name: 'subject',
      type: 'string',
      facet: false
    },
    // From header
    {
      name: 'from',
      type: 'string',
      facet: false
    },
    // To header
    {
      name: 'to',
      type: 'string',
      facet: false
    },
    // Content
    {
      name: 'content',
      type: 'string',
      facet: false
    },
    // Mailing List
    // Object with properties "id" and "name"
    // e.g.: { id: 726, "name": "tools-discuss" }
    {
      name: 'list',
      type: 'object',
      facet: true
    },
    // Message timestamp, in unix epoch seconds (can be negative for < 1970)
    {
      name: 'date',
      type: 'int64',
      facet: false
    }
  ]
}
