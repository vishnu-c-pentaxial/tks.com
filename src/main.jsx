import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './app.css';
import { getPage } from './clone/pages.js';
import { applyPageHead, setBodyClass, setDocumentTitle } from './clone/head.js';

const page = getPage(window.location.pathname);

applyPageHead(page.head);
setBodyClass(page.bodyClass);
setDocumentTitle(page.title);

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
