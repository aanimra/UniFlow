
import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router-dom';

import { StudyProvider } from './context/StudyContext';
import { ToastProvider } from './context/ToastProvider';

import { AppLayout } from './components/layout/AppLayout';
import { TodayPage } from './pages/TodayPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { TasksPage } from './pages/TasksPage';
import { WeekPage } from './pages/WeekPage';
import { FocusPage } from './pages/FocusPage';
import { ProgressPage } from './pages/ProgressPage';

function App() {
  return (
    <StudyProvider>
      <ToastProvider>
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
                element={<FocusPage />}
              />

              <Route
                path="progress"
                element={<ProgressPage />}
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
      </ToastProvider>
    </StudyProvider>
  );
}

export default App;
