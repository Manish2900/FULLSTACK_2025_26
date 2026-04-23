package com.remoteexam.controller;

import com.remoteexam.model.ExamAssignment;
import com.remoteexam.model.User;
import com.remoteexam.repository.ExamAssignmentRepository;
import com.remoteexam.security.JwtUtil;
import com.remoteexam.service.ExamService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class ExamController {

    private final ExamService examService;
    private final JwtUtil jwtUtil;
    private final ExamAssignmentRepository examAssignmentRepository;

    public ExamController(ExamService examService, JwtUtil jwtUtil,
                          ExamAssignmentRepository examAssignmentRepository) {
        this.examService = examService;
        this.jwtUtil = jwtUtil;
        this.examAssignmentRepository = examAssignmentRepository;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        User user = examService.authenticate(email, password);
        if (user != null) {
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
            
            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("id", user.getId().toString());
            response.put("name", user.getName());
            response.put("role", user.getRole());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
    }

    // ─── Student Endpoints ───

    @GetMapping("/student/assignments")
    public ResponseEntity<?> getStudentAssignments(@AuthenticationPrincipal User user) {
        List<ExamAssignment> assignments = examAssignmentRepository.findByStudentId(user.getId());
        List<Map<String, Object>> result = assignments.stream().map(a -> {
            Map<String, Object> m = new HashMap<>();
            m.put("assignmentId", a.getId().toString());
            m.put("examId", a.getExam().getId().toString());
            m.put("examTitle", a.getExam().getTitle());
            m.put("status", a.getStatus());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ─── Proctor Endpoints ───

    @GetMapping("/proctor/assignments")
    public ResponseEntity<?> getProctorAssignments(@AuthenticationPrincipal User user) {
        List<ExamAssignment> assignments = examAssignmentRepository.findByProctorId(user.getId());
        List<Map<String, Object>> result = assignments.stream().map(a -> {
            Map<String, Object> m = new HashMap<>();
            m.put("assignmentId", a.getId().toString());
            m.put("studentName", a.getStudent().getName());
            m.put("examTitle", a.getExam().getTitle());
            m.put("status", a.getStatus());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ─── Exam Endpoints ───

    @GetMapping("/exam/{examId}")
    public ResponseEntity<?> getExamDetails(@PathVariable String examId) {
        Map<String, Object> details = examService.getExamDetails(examId);
        if (details != null) {
            return ResponseEntity.ok(details);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Exam not found");
        }
    }

    @GetMapping("/exam/{examId}/questions")
    public ResponseEntity<?> getExamQuestions(@PathVariable String examId) {
        Object questions = examService.getExamQuestions(examId);
        if (questions != null) {
            return ResponseEntity.ok(questions);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Questions not found");
        }
    }

    @PostMapping("/exam/{examId}/submit")
    public ResponseEntity<?> submitExam(@PathVariable String examId, @RequestBody Map<String, Integer> answers) {
        Map<String, Object> result = examService.submitExam(examId, answers);
        return ResponseEntity.ok(result);
    }
}
