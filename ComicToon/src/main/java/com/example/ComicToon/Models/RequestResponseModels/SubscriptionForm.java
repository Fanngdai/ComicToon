package com.example.ComicToon.Models.RequestResponseModels;

public class SubscriptionForm{
    private String username;
    private String sub;

    /**
     * @return the username
     */
    public String getUsername() {
        return username;
    }

    /**
     * @return the sub
     */
    public String getSub() {
        return sub;
    }

    /**
     * @param sub the sub to set
     */
    public void setSub(String sub) {
        this.sub = sub;
    }

    /**
     * @param username the username to set
     */
    public void setUsername(String username) {
        this.username = username;
    }

}