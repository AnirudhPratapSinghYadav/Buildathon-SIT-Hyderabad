import { StudyProvider, useStudy } from './context/StudyContext';
import { LandingPage } from './components/LandingPage';
import { StudyWorkspace } from './components/StudyWorkspace';
import './styles/variables.css';
import './styles/global.css';

function AppContent() {
  const { state } = useStudy();

  return state.view === 'landing' ? <LandingPage /> : <StudyWorkspace />;
}

function App() {
  return (
    <StudyProvider>
      <AppContent />
    </StudyProvider>
  );
}

export default App;
