/**
 * One-off: removes what the real data replaced.
 * - `studentCount` on courses and lessons (learner counts are now live, from progress records)
 * - the fictional instructors: the `instructor` reference on courses, the documents, their photos
 * - `instructor` from the search agent's content scope
 *
 *   npx sanity exec scripts/media/cleanup.mjs --with-user-token
 */

import {getCliClient} from 'sanity/cli'
import {deleteOrphans} from './lib.mjs'

const client = getCliClient({apiVersion: '2025-01-01'})

const counted = await client.fetch(`*[_type in ["course", "lesson"] && defined(studentCount)]._id`)
const referencing = await client.fetch(`*[_type == "course" && defined(instructor)]._id`)
const instructors = await client.fetch(`*[_type == "instructor"]{_id, "photo": photo.asset._ref}`)

const transaction = client.transaction()
for (const id of counted) transaction.patch(id, (patch) => patch.unset(['studentCount']))
for (const id of referencing) transaction.patch(id, (patch) => patch.unset(['instructor']))
await transaction.commit()

const removal = client.transaction()
for (const {_id} of instructors) removal.delete(_id)
await removal.commit()
const freed = await deleteOrphans(client, instructors.map((instructor) => instructor.photo))

const context = await client.fetch(`*[_type == "sanity.agentContext" && slug.current == "vortex-search"][0]{_id, groqFilter}`)
if (context?.groqFilter?.includes('"instructor"')) {
  await client.patch(context._id).set({groqFilter: context.groqFilter.replace('"instructor", ', '')}).commit()
}

console.log(
  `Unset studentCount on ${counted.length}, instructor on ${referencing.length}; deleted ${instructors.length} instructors and ${freed} photos` +
    (context ? '; search scope updated' : ''),
)
