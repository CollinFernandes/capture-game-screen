import ReactDOM from 'react-dom/client';
import { isEnvBrowser } from '@/lib/constants';
import Record from './record'

// Styles
import '@/styles/index.scss';

if (isEnvBrowser) document.body.style.backgroundColor = '#1A1A1A';

ReactDOM.createRoot(document.body!).render(<><Record/></>);
