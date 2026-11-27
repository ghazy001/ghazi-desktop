import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
const json = (name) => JSON.parse(readFileSync(new URL(`../src/data/${name}`, import.meta.url), 'utf8'))
const profile = json('profile-data.json')
const projects = json('projects-data.json').categories.flatMap((c) => c.projects)
const windows = json('windows-data.json')
const ids = new Set(windows.map((w) => w.id))
assert.equal(profile.name, 'Ghazi Saoudi')
assert.equal(projects.length, 8)
assert.equal(profile.experience.length, 4)
assert.equal(profile.education.length, 2)
assert.equal(profile.certifications.length, 7)
assert.ok(ids.has('spider'))
assert.equal(ids.size, windows.length)
for (const w of windows) {
  for (const key of ['imgSrc', 'iconSrc']) assert.ok(existsSync(new URL(`../public${w[key]}`, import.meta.url)), `${w.id}: ${key}`)
  assert.ok(w.component && w.title.en && w.title.fr, `Incomplete application: ${w.id}`)
}
for (const section of Object.values(json('left-menu-data.json').leftMenuItems)) {
  for (const item of section) for (const task of item.subtasks) assert.ok(ids.has(task.action), `Invalid sidebar action: ${task.action}`)
}
const assets = json('asset-sources.json')
for (const asset of assets) {
  assert.ok(existsSync(new URL(`../public${asset.local}`, import.meta.url)), `Missing migrated asset: ${asset.local}`)
  assert.equal(new URL(asset.source).protocol, 'https:')
}
for (const p of projects) {
  assert.ok(p.description && p.technologies.length && p.sections.length, `Missing project content: ${p.id}`)
  for (const link of p.links) assert.equal(new URL(link.url).protocol, 'https:')
}
const playlist = json('playlist-data.json')
assert.equal(playlist.tracks.length, 7)
for (const track of playlist.tracks) {
  const audio = readFileSync(new URL(`../public${track.src}`, import.meta.url))
  assert.equal(createHash('sha256').update(audio).digest('hex'), track.sha256, `Changed audio file: ${track.id}`)
  assert.ok(track.duration > 0 && existsSync(new URL(`../public${track.cover}`, import.meta.url)), `Missing music metadata or artwork: ${track.id}`)
}
const cv = readFileSync(new URL(`../public${profile.cv.url}`, import.meta.url))
assert.ok(cv.subarray(0, 5).equals(Buffer.from('%PDF-')))
assert.equal(createHash('sha256').update(cv).digest('hex'), '98f6f892195508f1daf0d83c07775032008a86ce61d3ae07094bb4f62ef132de', 'The original CV must remain unchanged')
console.log(
  `Verified ${projects.length} projects, ${profile.experience.length} roles, ${profile.education.length} education entries, ${profile.certifications.length} credentials, ${windows.length} applications and ${assets.length} copied assets and ${playlist.tracks.length} unchanged MP3s with artwork; original CV checksum matches.`
)
