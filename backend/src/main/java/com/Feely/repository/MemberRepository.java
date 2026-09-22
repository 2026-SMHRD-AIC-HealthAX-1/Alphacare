package com.Feely.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.Feely.entity.MemberEntity;

// 회원 테이블에 접근하는 repository
@Repository
public interface MemberRepository extends JpaRepository<MemberEntity, Long> {

	// 회원가입 전에 같은 아이디가 이미 등록되어 있는지 확인
	@Query("select count(m) > 0 from MemberEntity m where m.id = :id")
	boolean existsByMemberId(@Param("id") String id);

	// 회원가입 전에 같은 휴대폰 번호가 이미 등록되어 있는지 확인
	@Query("select count(m) > 0 from MemberEntity m where m.phone = :phone")
	boolean existsByPhone(@Param("phone") String phone);

	// 아이디 찾기 이름, 휴대폰번호로 회원 정보 확인
	@Query("select m from MemberEntity m where m.name = :name and m.phone = :phone")
	Optional<MemberEntity> findMemberByNameAndPhone(@Param("name") String name, @Param("phone") String phone);

	// 비밀번호 찾기 아이디, 휴대폰번호로 회원 정보 확인
	@Query("select m from MemberEntity m where m.id = :id and m.phone = :phone")
	Optional<MemberEntity> findMemberByIdAndPhone(@Param("id") String id, @Param("phone") String phone);

	// 로그인할 때 아이디로 회원 정보를 조회
	@Query("select m from MemberEntity m where m.id = :id")
	Optional<MemberEntity> findMemberById(@Param("id") String id);

}
