import profile from './profile-data.json'
import configuration from './browser-data.json'
import { frameRestriction } from '../lib/internet-explorer.mjs'

// Keep Explorer shortcuts limited to websites that permit embedding.
export default profile.links
  .filter((link) => !frameRestriction(link.url, configuration.frameRestrictions))
  .sort((a, b) => Number(b.url === profile.website) - Number(a.url === profile.website))
