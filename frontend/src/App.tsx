import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';

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

// createBrowserRouter(data router) 사용: 상담 페이지에서 뒤로가기/앞으로가기까지 막으려면
// useBlocker/usePrompt가 필요한데 이건 data router에서만 동작해서 BrowserRouter 대신 이걸로 교체함
const router = createBrowserRouter(
  createRoutesFromElements(
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
  ),
  { basename: "/Feely" }
);

export default function App() {
  return <RouterProvider router={router} />;
}
