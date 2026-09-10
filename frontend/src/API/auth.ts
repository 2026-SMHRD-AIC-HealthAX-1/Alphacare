// 회원가입, 로그인, 아이디/비밀번호 찾기
//중요한 데이터 or 보안이 중요한 데이터는 Post방식
import {api} from "./axios"
import {UserData} from "./user"

//아이디 중복 확인
export const checkDuplicateId = async (userId : string) : Promise<boolean> => {
  const response = await api.get<[UserData]>("/api/user", {
    params : { ID : userId },
  });    
  return response.data.length > 0;
}

//회원가입
export const signupUser = async (newUser : UserData) : Promise<UserData> => {
  const response = await api.post<UserData>("/api/user", newUser);
  return response.data
}

//로그인
