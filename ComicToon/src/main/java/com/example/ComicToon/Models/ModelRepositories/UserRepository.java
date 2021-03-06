package com.example.ComicToon.Models.ModelRepositories;
import java.util.List;
import com.example.ComicToon.Models.UserModel;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<UserModel, String>{
    public UserModel findByusername(String username);
    public UserModel findBytoken(String token);
    public UserModel findByemail(String email);
    public UserModel findByid(String id);
    public List<UserModel> findAll();
}