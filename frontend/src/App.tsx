import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

import Header from './components/Header';
import Footer from './components/Footer';
import MainPage from './pages/MainPage';
import CounselPage from './pages/CounselPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyPage from './pages/MyPage';

export default function App() {
  return (
    <Router>
{/* routes 링크 패치 path뒤에 있는거 사용하면 됨 */}
      <Routes>
        <Route element={<Layout />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/Counsel" element={<CounselPage />} />
        <Route path="/Login" element={<LoginPage />} />
        <Route path="/SignUp" element={<SignupPage />} />
        <Route path="/MyPage" element={<MyPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
