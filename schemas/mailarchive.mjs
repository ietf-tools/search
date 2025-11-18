/**
 * Collection of mailarchive messages
 */
export default {
  name: 'mailarchive',
  enable_nested_fields: true,
  fields: [
    // Hashcode (ID)
    {
      name: 'id',
      type: 'string',
      facet: false
    },
    // Subject (sanitzed)
    {
      name: 'subject',
      type: 'string',
      facet: false
    },
    // From Name
    {
      name: 'fromName',
      type: 'string',
      facet: false
    },
    // From Email
    {
      name: 'fromEmail',
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
    {
      name: 'list',
      type: 'string',
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
