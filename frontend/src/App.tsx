import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

import MainPage from './pages/MainPage';
import CounselPage from './pages/CounselPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyPage from './pages/MyPage';
import FindId from './pages/FindId';
import FindPw from './pages/FindPw';

export default function App() {
  return (
    <Router basename = "/Feely">
{/* routes 링크 패치 path뒤에 있는거 사용하면 됨 */}
      <Routes>
        <Route element={<Layout />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/Counsel" element={<CounselPage />} />
        <Route path="/Login" element={<LoginPage />} />
        <Route path="/SignUp" element={<SignupPage />} />
        <Route path="/MyPage" element={<MyPage />} />
        <Route path="/FindId" element={<FindId />} />
        <Route path="/FindPw" element={<FindPw />} />
        </Route>
      </Routes>
    </Router>
  );
}