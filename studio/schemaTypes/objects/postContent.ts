import {defineArrayMember, defineType} from 'sanity'

import {blockContent} from './blockContent'

/**
 * A field note's body: the shared rich text (text, lists, links, images) plus diagrams and
 * callouts. Kept separate from `blockContent` so lesson notes stay simpler.
 */
export const postContent = defineType({
  name: 'postContent',
  title: 'Field note body',
  type: 'array',
  of: [
    ...blockContent.of,
    defineArrayMember({type: 'diagram'}),
    defineArrayMember({type: 'callout'}),
  ],
})
