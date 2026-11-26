import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { ROOT, computerCatalog, resolveComputerLocation, searchComputer } from '../src/lib/computer-explorer.mjs'
const json = (name) => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url)))
const config = json('computer-data'),
  profile = json('profile-data'),
  apps = json('windows-data'),
  playlist = json('playlist-data'),
  projects = json('projects-data').categories.flatMap((c) => c.projects)
for (const lang of ['en', 'fr']) {
  const catalog = computerCatalog({ config, profile, apps, playlist, projects }, lang)
  assert.equal(catalog.drives.length, 4)
  assert.equal(catalog.locations[ROOT].length, 7)
  assert.equal(catalog.locations['D:'].length, projects.length)
  assert.equal(catalog.locations['E:'].filter((e) => e.file?.kind === 'video').length, 2)
  assert.equal(new Set(catalog.all.map((e) => e.id)).size, catalog.all.length)
  for (const item of catalog.all) {
    if (item.target) assert.ok(catalog.locations[item.target], item.target)
    if (item.app)
      assert.ok(
        apps.some((a) => a.id === item.app),
        item.app
      )
    if (item.icon) assert.ok(existsSync(new URL(`../public${item.icon}`, import.meta.url)), item.icon)
    if (item.project) assert.ok(projects.includes(item.project))
  }
  assert.ok(catalog.locations['C:'].find((e) => e.file?.kind === 'text').file.text.includes(profile.name))
  assert.ok(searchComputer(catalog.all, 'react').some((e) => e.project))
  assert.ok(searchComputer(catalog.all, 'testflow').some((e) => e.project?.id === 'testflow'))
  assert.equal(searchComputer(catalog.all, 'no-such-portfolio-file-xyz').length, 0)
  assert.equal(searchComputer(catalog.all, '').length, catalog.all.length)
  assert.equal(catalog.locations[ROOT].find((e) => e.id === 'network-portfolio').file.url, profile.website)
}
for (const [address, expected] of [
  ['My Computer', ROOT],
  ['Poste de travail', ROOT],
  ['d:/', 'D:'],
  ['C:\\', 'C:'],
  ['PROJECTS (D:)\\', 'D:'],
  ['Z:', null],
  ['C:\\unknown', null]
])
  assert.equal(resolveComputerLocation(address, config), expected, address)
assert.equal(searchComputer([{ name: 'Compétences', description: 'développement', type: 'Dossier' }], 'competences developpement').length, 1)
console.log('My Computer checks passed: four populated drives, real projects/demos, valid app/assets, Unicode search, address resolution, and original portfolio link.')
