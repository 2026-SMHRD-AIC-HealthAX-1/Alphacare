import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 공통 레이아웃 (헤더, 푸터, 다크모드)
import Layout from './components/Layout';

import MainPage from './pages/MainPage';
import CounselPage from './pages/CounselPage';
import LoginPage from './pages/login/LoginPage';
import SignupPage from './pages/login/SignupPage';
import KakaoCallback from './pages/login/KakaoCallback';
import MyPage from './pages/mypages/MyPage';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';
import FindId from './pages/login/FindId';
import FindPw from './pages/login/FindPw';
import Admin from "./pages/Manager";

export default function App() {
  return (
    <Router basename = "/Feely">
      {/* 페이지 라우팅 */}
      <Routes>
        <Route element={<Layout />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/Counsel" element={<CounselPage />} />
        <Route path="/Login" element={<LoginPage />} />
        <Route path="/Login/kakao/callback" element={<KakaoCallback />} />
        <Route path="/SignUp" element={<SignupPage />} />
        <Route path="/MyPage" element={<RequireAuth><MyPage /></RequireAuth>} />
        <Route path="/FindId" element={<FindId />} />
        <Route path="/FindPw" element={<FindPw />} />
        <Route path="/Admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
        </Route>
      </Routes>
    </Router>
  );
}