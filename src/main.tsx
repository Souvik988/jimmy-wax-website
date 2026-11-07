import { createRoot } from 'react-dom/client'
import App from './App'
import { bootFromCache } from './lib/experience'
import './styles/tokens.css'
import './styles/home.css'
import './styles/commerce.css'
import './styles/checkout.css'
import './styles/blocks.css'

// repeat visit: paint with the last published design tokens straight away (no flash of the default theme)
bootFromCache()

createRoot(document.getElementById('root')!).render(
  <App />,
)
