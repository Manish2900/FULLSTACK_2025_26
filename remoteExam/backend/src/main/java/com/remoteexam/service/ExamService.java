package com.remoteexam.service;

import com.remoteexam.model.User;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class ExamService {

    private final Map<String, User> users = new HashMap<>();

    public ExamService() {
        // Hardcoded users: 2 students
        users.put("student1@college.edu", new User("s1", "Alice Student", "student1@college.edu", "password123", "STUDENT"));
        users.put("student2@college.edu", new User("s2", "Bob Student", "student2@college.edu", "password123", "STUDENT"));
    }

    public User authenticate(String email, String password) {
        User user = users.get(email);
        if (user != null && user.getPassword().equals(password)) {
            return user;
        }
        return null;
    }

    public Map<String, Object> getExamDetails(String examId) {
        // Mock exam details
        Map<String, Object> details = new HashMap<>();
        if ("exam001".equals(examId)) {
            details.put("examId", examId);
            details.put("title", "Final Mathematics Examination");
            details.put("description", "This is the final exam for the Fall semester. Make sure your webcam remains active.");
            details.put("durationMinutes", 120);
            return details;
        }
        return null;
    }
}
