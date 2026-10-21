
import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router-dom';

import { StudyProvider } from './context/StudyContext';
import { AppLayout } from './components/layout/AppLayout';
import { TodayPage } from './pages/TodayPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { SubjectsPage } from './pages/SubjectsPage';

function App() {
  return (
    <StudyProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<TodayPage />} />

            <Route
                path="subjects"
                element={<SubjectsPage />}
            />

            <Route
              path="tasks"
              element={
                <PlaceholderPage
                  title="Мої завдання"
                  description="Створення, редагування та відстеження завдань."
                />
              }
            />

            <Route
              path="week"
              element={
                <PlaceholderPage
                  title="Мій тиждень"
                  description="Календар навчального навантаження."
                />
              }
            />

            <Route
              path="focus"
              element={
                <PlaceholderPage
                  title="Режим концентрації"
                  description="Таймер для зосередженої роботи над завданнями."
                />
              }
            />

            <Route
              path="progress"
              element={
                <PlaceholderPage
                  title="Мій прогрес"
                  description="Статистика виконаних і запланованих завдань."
                />
              }
            />

            <Route
              path="*"
              element={
                <PlaceholderPage
                  title="Сторінку не знайдено"
                  description="Перевір адресу або повернися на головну."
                />
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </StudyProvider>
  );
}

export default App;
