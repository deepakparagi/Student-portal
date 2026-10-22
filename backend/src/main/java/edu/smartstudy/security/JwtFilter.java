package edu.smartstudy.security;
import edu.smartstudy.user.User;
import edu.smartstudy.user.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtFilter extends OncePerRequestFilter {
    private final TokenService tokens;
    private final UserRepository users;

    public JwtFilter(TokenService tokens, UserRepository users) {
        this.tokens = tokens;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String rawToken = null;
        Cookie[] cs = req.getCookies();
        if (cs != null) {
            for (Cookie c : cs) {
                if (c.getName().equals("study_session")) {
                    rawToken = c.getValue();
                    break;
                }
            }
        }
        if (rawToken == null) {
            String authHeader = req.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                rawToken = authHeader.substring(7).trim();
            }
        }

        if (rawToken != null && !rawToken.isBlank()) {
            try {
                Claims claims = tokens.parse(rawToken);
                String email = claims.getSubject();
                Integer tokenVersion = claims.get("token_version", Integer.class);
                
                var userOpt = users.findEnabledByEmailIgnoreCase(email);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    if (tokenVersion != null && tokenVersion.equals(user.getTokenVersion())) {
                        var auth = new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + claims.get("role", String.class)))
                        );
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                }
            } catch (Exception e) {
                // Invalid or expired token - proceed unauthenticated
            }
        }
        chain.doFilter(req, res);
    }
}