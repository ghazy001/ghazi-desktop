import { defineStore } from 'pinia'
import profile from '@/data/profile-data.json'
import data from '@/data/projects-data.json'
import { resolveCommand } from '@/lib/portfolio-terminal.mjs'
export const portfolioProjects = data.categories.flatMap((c) => c.projects)
// Memory-only: neither chat transcripts nor visitor prompts are saved to localStorage.
export const useAssistantStore = defineStore('assistant', {
  state: () => ({ messages: [], terminal: [], busy: false }),
  actions: {
    run(raw, openWindow, navigation, source = 'visitor') {
      const result = resolveCommand(raw, profile, portfolioProjects)
      if (result?.clear) {
        this.terminal = []
        return result
      }
      const entry = result || { command: String(raw).slice(0, 160), output: 'Command not available. Type help to see the portfolio commands.', error: true }
      this.terminal.push({ ...entry, source })
      this.terminal = this.terminal.slice(-80)
      if (result?.app) {
        if (result.app === 'myProjects') navigation.currentActiveProject = result.projectId ? portfolioProjects.find((p) => p.id === result.projectId) : null
        openWindow(result.app)
      }
      return entry
    }
  }
})
