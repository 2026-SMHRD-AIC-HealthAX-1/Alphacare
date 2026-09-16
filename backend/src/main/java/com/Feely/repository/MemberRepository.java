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

	// 로그인할 때 아이디로 회원 정보를 조회
	@Query("select m from MemberEntity m where m.id = :id")
	Optional<MemberEntity> findMemberById(@Param("id") String id);

}
