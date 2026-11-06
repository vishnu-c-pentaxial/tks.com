import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Home, ROUTES } from './react-generated/pages/routes.js';

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        {ROUTES.map(({ route, Component }) => (
          <Route key={route} path={route} element={<Component />} />
        ))}
        <Route path="*" element={<Home />} />
      </Routes>
    </Suspense>
  );
}
