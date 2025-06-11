# docs

Contains all drafts and rfc documents.

```js
{
    name: 'docs',
    enable_nested_fields: true,
    default_sorting_field: 'ranking',
    fields: [
      // RFC number in integer form, for sorting asc/desc in search results
      // Omit field for drafts
      {
        name: 'rfcNumber',
        type: 'int32',
        facet: false,
        optional: true,
        sort: true
      },
      // RFC number in string form, for direct matching with ranking
      // Omit field for drafts
      {
        name: 'rfc',
        type: 'string',
        facet: false,
        optional: true
      },
      // For drafts that correspond to an RFC, insert the RFC number
      // Omit field for rfcs or if not relevant
      {
        name: 'ref',
        type: 'string',
        facet: false,
        optional: true
      },
      // Filename of the document (without the extension, e.g. "rfc1234" or "draft-ietf-abc-def-02")
      {
        name: 'filename',
        type: 'string',
        facet: false,
        infix: true
      },
      // Title of the draft / rfc
      {
        name: 'title',
        type: 'string',
        facet: false
      },
      // Abstract of the draft / rfc
      {
        name: 'abstract',
        type: 'string',
        facet: false
      },
      // A list of search keywords if relevant, set to empty array otherwise
      {
        name: 'keywords',
        type: 'string[]',
        facet: true
      },
      // Type of the document
      // Accepted values: "draft" or "rfc"
      {
        name: 'type',
        type: 'string',
        facet: true
      },
      // State(s) of the document (e.g. "Published", "Adopted by a WG", etc.)
      // Use the full name, not the slug
      {
        name: 'state',
        type: 'string[]',
        facet: true,
        optional: true
      },
      // Standard Level Name (e.g. "Proposed Standard", "Informational", etc.)
      // Use the full name, not the slug
      {
        name: 'stdlevelname',
        type: 'string',
        facet: true,
        optional: true
      },
      // The BCP series number it is part of. (e.g. "123")
      // Omit otherwise.
      {
        name: 'bcp',
        type: 'string',
        facet: true,
        optional: true
      },
      // The STD series number it is part of. (e.g. "123")
      // Omit otherwise.
      {
        name: 'std',
        type: 'string',
        facet: true,
        optional: true
      },
      // The FYI series number it is part of. (e.g. "123")
      // Omit otherwise.
      {
        name: 'fyi',
        type: 'string',
        facet: true,
        optional: true
      },
      // Number of pages
      {
        name: 'pages',
        type: 'int32',
        facet: false
      },
      // Date of the document, in unix epoch seconds (can be negative for < 1970)
      {
        name: 'date',
        type: 'int64',
        facet: false
      },
      // Expiration date of the document, in unix epoch seconds (can be negative for < 1970)
      // Omit field for RFCs
      {
        name: 'expires',
        type: 'int64',
        facet: false,
        optional: true
      },
      // Publication date of the RFC, in unix epoch seconds (can be negative for < 1970)
      // Omit field for drafts
      {
        name: 'publicationDate',
        type: 'int64',
        facet: true,
        optional: true
      },
      // Working Group
      // Object with properties "acronym", "name" and "full"
      // e.g.: { acronym: "ntp", "name": "Network Time Protocols", full: "ntp - Network Time Protocols" }
      {
        name: 'group',
        type: 'object',
        facet: true,
        optional: true
      },
      // Area
      // Object with properties "acronym", "name" and "full"
      // e.g.: { acronym: "mpls", "name": "Multiprotocol Label Switching", full: "mpls - Multiprotocol Label Switching" }
      {
        name: 'area',
        type: 'object',
        facet: false,
        optional: true
      },
      // Stream slug (e.g. "IETF")
      {
        name: 'stream',
        type: 'string',
        facet: true,
        optional: true
      },
      // List of authors
      // Array of objects with properties "name" and "affiliation"
      // e.g.: [{ name: "John Doe", affiliation: "ACME Inc." }, { name: "Ada Lovelace", affiliation: "Babbage Corps." }]
      {
        name: 'authors',
        type: 'object[]',
        facet: true,
        optional: true
      },
      // Area Director Name (e.g. "Leonardo DaVinci")
      {
        name: 'adName',
        type: 'string',
        facet: true,
        optional: true
      },
      // Whether the document is obsoleted by another document or not.
      {
        name: 'flags.obsoleted',
        type: 'bool',
        facet: true
      },
      // Whether the document is updated by another document or not.
      {
        name: 'flags.updated',
        type: 'bool',
        facet: true
      },
      // List of documents that obsolete this document.
      // Array of strings. Use RFC number for RFCs. (e.g. ["123", "456"])
      // Omit if none. Must be provided if "flags.obsoleted" is set to true.
      {
        name: 'obsoletedBy',
        type: 'string[]',
        facet: false,
        optional: true
      },
      // List of documents that update this document.
      // Array of strings. Use RFC number for RFCs. (e.g. ["123", "456"])
      // Omit if none. Must be provided if "flags.updated" is set to true.
      {
        name: 'updatedBy',
        type: 'string[]',
        facet: false,
        optional: true
      },
      // Ranking value to use when no explicit sorting is used during search
      // Set to the RFC number for RFCs and the revision number for drafts
      // This ensures newer RFCs get listed first in the default search results (without a query)
      {
        name: 'ranking',
        type: 'int32',
        facet: false
      }
    ]
  }
```
