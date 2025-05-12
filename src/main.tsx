import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './../public/i18n/i18n.tsx'
import App from './App.tsx'
import '@ant-design/v5-patch-for-react-19';
import 'antd-css-utilities/utility.min.css'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './providers/authContext.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <HashRouter>
                <App />
            </HashRouter>
        </AuthProvider>
    </StrictMode>,
)
