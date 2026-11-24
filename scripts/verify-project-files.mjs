import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { projectDescription, projectFiles } from '../src/lib/project-files.mjs'
const projects = JSON.parse(readFileSync(new URL('../src/data/projects-data.json', import.meta.url))).categories.flatMap((category) => category.projects)
let videos = 0,
  images = 0,
  links = 0
for (const project of projects) {
  const files = projectFiles(project)
  assert.equal(files.filter((file) => file.name === 'description.txt').length, 1)
  assert.equal(files.filter((file) => file.name === 'image.jpg').length, 1)
  assert.equal(new Set(files.map((file) => file.name)).size, files.length)
  const description = readFileSync(new URL(`../public/projects/${project.id}/description.txt`, import.meta.url), 'utf8')
  assert.equal(description, projectDescription(project), `Outdated description for ${project.id}`)
  for (const section of project.sections) for (const block of section.blocks) assert.ok(description.includes(block.text))
  for (const file of files) {
    if (file.kind === 'video') {
      videos++
      assert.equal(file.src, project.video.url)
    }
    if (file.kind === 'image') {
      images++
      assert.ok(existsSync(new URL('../public' + file.src, import.meta.url)))
      assert.equal(file.images.length, 1 + project.gallery.length)
    }
    if (file.kind === 'link') {
      links++
      assert.equal(new URL(file.url).protocol, 'https:')
      assert.ok(file.name.endsWith('.url'))
    }
  }
  const jpeg = readFileSync(new URL(`../public/projects/${project.id}/image.jpg`, import.meta.url))
  assert.equal(jpeg.readUInt16BE(0), 0xffd8, `Invalid JPEG: ${project.id}`)
}
assert.equal(videos, 2)
assert.equal(images, 18)
console.log(
  `Verified ${projects.length} project folders, ${projects.length} complete descriptions, ${images} real images, ${videos} available videos and ${links} web shortcuts.`
)
