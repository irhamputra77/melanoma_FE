import AppRoutes from './routes/AppRoutes';
import { LanguageProvider } from './contexts/LanguageContext';

export default function App() {
  return <LanguageProvider>
    <AppRoutes />
  </LanguageProvider>

}