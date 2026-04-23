package com.remoteexam.service;

import com.remoteexam.model.Exam;
import com.remoteexam.model.User;
import com.remoteexam.repository.ExamRepository;
import com.remoteexam.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class ExamService {

    private final UserRepository userRepository;
    private final ExamRepository examRepository;

    public ExamService(UserRepository userRepository, ExamRepository examRepository) {
        this.userRepository = userRepository;
        this.examRepository = examRepository;
    }

    public User authenticate(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
            return userOpt.get();
        }
        return null;
    }

    public Map<String, Object> getExamDetails(String examIdStr) {
        try {
            UUID examId = UUID.fromString(examIdStr);
            Optional<Exam> examOpt = examRepository.findById(examId);
            if (examOpt.isPresent()) {
                Exam exam = examOpt.get();
                Map<String, Object> details = new HashMap<>();
                details.put("examId", exam.getId().toString());
                details.put("title", exam.getTitle());
                details.put("description", exam.getDescription());
                details.put("durationMinutes", exam.getDurationMins());
                return details;
            }
        } catch (IllegalArgumentException e) {
            // Not a valid UUID
        }
        return null;
    }

    public Object getExamQuestions(String examId) {
        // Mocking questions for phase 1
        return java.util.Arrays.asList(
            createQuestion(1, "What is 2 + 2?", "3", "4", "5", "6"),
            createQuestion(2, "What is the square root of 16?", "2", "4", "8", "16"),
            createQuestion(3, "What is 10 * 5?", "15", "50", "105", "500")
        );
    }

    public Map<String, Object> submitExam(String examId, Map<String, Integer> answers) {
        int score = 0;
        int total = 3;
        
        if (answers.containsKey("1") && answers.get("1") == 1) score++; 
        if (answers.containsKey("2") && answers.get("2") == 1) score++; 
        if (answers.containsKey("3") && answers.get("3") == 1) score++; 

        Map<String, Object> result = new HashMap<>();
        result.put("score", score);
        result.put("total", total);
        result.put("message", "Exam submitted successfully");
        return result;
    }

    private Map<String, Object> createQuestion(int id, String text, String... options) {
        Map<String, Object> q = new HashMap<>();
        q.put("id", id);
        q.put("text", text);
        q.put("options", java.util.Arrays.asList(options));
        return q;
    }
}
