package com.drro.security;

import com.drro.entity.Role;
import com.drro.entity.User;
import com.drro.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserDetailsServiceImplTest {
    @Test
    void prefixesDatabaseRoleForHasRoleAuthorization() {
        UserRepository users = mock(UserRepository.class);
        User user = User.builder().email("admin@drro.test").passwordHash("hash")
                .status(User.UserStatus.ACTIVE).role(Role.builder().roleName("ADMIN").build()).build();
        when(users.findByEmail("admin@drro.test")).thenReturn(Optional.of(user));

        UserDetails details = new UserDetailsServiceImpl(users).loadUserByUsername("admin@drro.test");

        assertTrue(details.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
    }
}