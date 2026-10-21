
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
import { TasksPage } from './pages/TasksPage';
import { WeekPage } from './pages/WeekPage';
import { FocusPage } from './pages/FocusPage';

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
                element={<TasksPage />}
            />

            <Route
                path="week"
                element={<WeekPage />}
            />

            <Route
                path="focus"
                element={<FocusPage/>}
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
