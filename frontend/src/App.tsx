import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
      {/* Header 상단메뉴 */}
      <Header />

      {/* routes 링크 패치 path뒤에 있는거 사용하면 됨 */}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/Counsel" element={<CounselPage />} />
        <Route path="/Login" element={<LoginPage />} />
        <Route path="/SignUp" element={<SignupPage />} />
        <Route path="/MyPage" element={<MyPage />} />
      </Routes>

      {/* Footer 하단 첨부 */}
      <Footer />
    </Router>
  );
}
