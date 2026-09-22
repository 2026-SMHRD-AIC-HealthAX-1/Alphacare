package com.Feely;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;

import com.Feely.entity.MemberEntity;
import com.Feely.repository.MemberRepository;

@SpringBootTest
class BackendApplicationTests {

	@Autowired
	private MemberRepository memberRepository;

	@Test
	void contextLoads() {
	}

	@Test
	void duplicatePhoneShouldBeRejected() {
		String phone = "010" + String.format("%08d", Math.abs(System.nanoTime() % 100000000L));
		String firstId = "phone_dup_test_1_" + System.nanoTime();
		String secondId = "phone_dup_test_2_" + System.nanoTime();

		MemberEntity first = new MemberEntity();
		first.setId(firstId);
		first.setPw("password!1");
		first.setName("첫번째회원");
		first.setPhone(phone);
		first.setRole("USER");
		first.setMileage(0);
		memberRepository.saveAndFlush(first);

		MemberEntity second = new MemberEntity();
		second.setId(secondId);
		second.setPw("password!2");
		second.setName("두번째회원");
		second.setPhone(phone);
		second.setRole("USER");
		second.setMileage(0);

		assertThrows(DataIntegrityViolationException.class, () -> memberRepository.saveAndFlush(second));
		memberRepository.delete(first);
	}

}
