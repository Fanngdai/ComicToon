package com.example.ComicToon;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.web.access.channel.ChannelProcessingFilter;


@SpringBootApplication
public class ComicToonApplication{
    public static void main(String[] args) {
		SpringApplication.run(ComicToonApplication.class, args);
	}


@Configuration
protected static class SecurityConfiguration extends WebSecurityConfigurerAdapter {
    
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.addFilterBefore(new CorsSupport(), ChannelProcessingFilter.class);
        http
        .authorizeRequests()
        .antMatchers(
            "/",
            "/register",
            "/login", 
            "/forgot", 
            "/forgotVerification", 
            "/forgotChangePassword",
            "/verifyAccount",
            "/checkToken",
            "/create/series",
            "/delete/series",
            "/view/comic-series",
            "/view/series-viewable",
            "/create/comic",
            "/delete/comic",
            "/view/comic",
            "/view/series",
            "/subscriptions",
            "/subscribe",
            "/view/allComics",
            "/view/panel",
            "/welcomerecent",
            "/welcomesubscriptions",
            "/delComic",
            "/upload",
            "/update/comic",
            "/update/series",
            "/search",
            "/unsubscribe",
            "/comic/rate",
            "/comic/rate/getRating",
            "/report",
            "/deactivate",
            "/adminData",
            "/adminRemoveComic",
            "/adminRemoveSeries",
            "/adminRemoveComment",
            "/comment",
            "/getComments",
            "/delete/comment",
            "/welcomefavorites",
            "/getSharedComics",
            "/delete-report",
            "/sidebar",
            "/view/series-data",
            "/isSubbed"
            )
        .permitAll()
        .and()
        .authorizeRequests()
        .anyRequest()
        .authenticated()
        .and().csrf().disable();
    }
}
}