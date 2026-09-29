import { StrictMode, type ComponentType } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import '@src/styles/global.css'

type StoryProps = Record<string, unknown>
type Story = ComponentType<StoryProps>
type StoryModule = Record<string, Story>

const stories = import.meta.glob<StoryModule>('../../src/**/*.story.{tsx,jsx}')

function getStoryPath(filePath: string) {
  return filePath.replace(/^(\.\.\/)+src\//, '').replace(/\.story\.\w+$/, '')
}

async function resolveStory(storyId: string) {
  const separatorIndex = storyId.lastIndexOf('/')
  const path = storyId.slice(0, separatorIndex)
  const exportName = storyId.slice(separatorIndex + 1)
  const filePath = Object.keys(stories).find((candidate) => {
    const storyPath = getStoryPath(candidate)

    return storyPath === path || storyPath.endsWith(`/${path}`)
  })
  const storyModule = filePath ? await stories[filePath]() : undefined

  return storyModule?.[exportName] ?? storyModule?.default
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Component gallery root element was not found')
}

let root: Root | undefined

window.mount = async ({ story, props = {} }) => {
  const Story = await resolveStory(story)

  if (!Story) {
    throw new Error(`Unknown story: ${story}`)
  }

  root ??= createRoot(rootElement)

  flushSync(() => {
    root?.render(
      <StrictMode>
        <Story {...props} />
      </StrictMode>,
    )
  })
}

window.unmount = async () => {
  root?.unmount()
  root = undefined
}

declare global {
  interface Window {
    mount: (parameters: { story: string; props?: StoryProps }) => Promise<void>
    unmount: () => Promise<void>
  }
}
