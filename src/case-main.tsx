import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/prata'
import './case.css'
import { CasePage } from './case/CasePage'

createRoot(document.getElementById('case-root')!).render(
  <React.StrictMode><CasePage /></React.StrictMode>,
)
