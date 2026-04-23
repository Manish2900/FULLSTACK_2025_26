package com.remoteexam.config;

import com.remoteexam.model.Exam;
import com.remoteexam.model.ExamAssignment;
import com.remoteexam.model.User;
import com.remoteexam.repository.ExamAssignmentRepository;
import com.remoteexam.repository.ExamRepository;
import com.remoteexam.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final ExamAssignmentRepository examAssignmentRepository;

    public DataInitializer(UserRepository userRepository, ExamRepository examRepository,
                           ExamAssignmentRepository examAssignmentRepository) {
        this.userRepository = userRepository;
        this.examRepository = examRepository;
        this.examAssignmentRepository = examAssignmentRepository;
    }

    @Override
    public void run(String... args) {
        // Only seed if the database is empty
        if (userRepository.count() > 0) {
            System.out.println("[DataInitializer] Database already seeded. Skipping.");
            return;
        }

        System.out.println("[DataInitializer] Seeding database with test data...");

        // Create Users
        User student1 = new User("Alice Student", "student1@college.edu", "password123", "STUDENT");
        User student2 = new User("Bob Student", "student2@college.edu", "password123", "STUDENT");
        User proctor = new User("Mr. Proctor", "proctor@college.edu", "password123", "PROCTOR");

        student1 = userRepository.save(student1);
        student2 = userRepository.save(student2);
        proctor = userRepository.save(proctor);

        // Create Exam
        Exam exam = new Exam();
        exam.setTitle("Final Mathematics Examination");
        exam.setDescription("This is the final exam for the Fall semester. Make sure your webcam remains active.");
        exam.setStartTime(LocalDateTime.now());
        exam.setEndTime(LocalDateTime.now().plusHours(2));
        exam.setDurationMins(120);
        exam.setCreatedBy(proctor);
        exam = examRepository.save(exam);

        // Create Assignments
        ExamAssignment assignment1 = new ExamAssignment();
        assignment1.setExam(exam);
        assignment1.setStudent(student1);
        assignment1.setProctor(proctor);
        examAssignmentRepository.save(assignment1);

        ExamAssignment assignment2 = new ExamAssignment();
        assignment2.setExam(exam);
        assignment2.setStudent(student2);
        assignment2.setProctor(proctor);
        examAssignmentRepository.save(assignment2);

        System.out.println("[DataInitializer] Database seeded successfully!");
        System.out.println("  Exam ID: " + exam.getId());
        System.out.println("  Student 1 (Alice): " + student1.getId());
        System.out.println("  Student 2 (Bob):   " + student2.getId());
        System.out.println("  Proctor:           " + proctor.getId());
    }
}
