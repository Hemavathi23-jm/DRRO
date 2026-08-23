package com.drro.security;

import com.drro.entity.User;
import com.drro.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with email: " + email));

        if (user.getStatus() == User.UserStatus.INACTIVE) {
            throw new UsernameNotFoundException("User account is inactive: " + email);
        }

        // Role stored as "ADMIN", "OFFICER", etc. — prefix with ROLE_ for Spring Security
        String roleName = "ROLE_" + user.getRole().getRoleName();

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(List.of(new SimpleGrantedAuthority(roleName)))
                .build();
    }
}
