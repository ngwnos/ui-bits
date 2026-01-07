import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import 'ui-bits/style.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ScrollArea.Root className="app-scroll-root" type="scroll">
      <ScrollArea.Viewport className="app-scroll-viewport">
        <App />
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="app-scrollbar" orientation="vertical">
        <ScrollArea.Thumb className="app-scroll-thumb" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar className="app-scrollbar" orientation="horizontal">
        <ScrollArea.Thumb className="app-scroll-thumb" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner className="app-scroll-corner" />
    </ScrollArea.Root>
  </StrictMode>,
)
