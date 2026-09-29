import {defineField, defineType} from 'sanity'

/** One cited source, rendered in a numbered References list at the end of a field note. */
export const reference = defineType({
  name: 'citation',
  title: 'Reference',
  type: 'object',
  fields: [
    defineField({
      name: 'authors',
      description: 'As cited, e.g. "Roediger, H. L., & Karpicke, J. D."',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'year', type: 'number', validation: (rule) => rule.required().integer()}),
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'venue',
      description: 'Journal, volume(issue), pages; or the book or proceedings.',
      type: 'string',
    }),
    defineField({
      name: 'url',
      description: 'DOI link or the publisher page.',
      type: 'url',
      validation: (rule) => rule.uri({scheme: ['https']}),
    }),
  ],
  preview: {
    select: {authors: 'authors', year: 'year', title: 'title'},
    prepare({authors, year, title}) {
      return {title, subtitle: [authors, year].filter(Boolean).join(' · ')}
    },
  },
})
