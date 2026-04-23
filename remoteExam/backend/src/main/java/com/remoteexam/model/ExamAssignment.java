package com.remoteexam.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exam_assignments")
public class ExamAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id")
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proctor_id")
    private User proctor;

    @Column(length = 50)
    private String status = "PENDING"; // PENDING, ACTIVE, COMPLETED

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    public ExamAssignment() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Exam getExam() { return exam; }
    public void setExam(Exam exam) { this.exam = exam; }

    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }

    public User getProctor() { return proctor; }
    public void setProctor(User proctor) { this.proctor = proctor; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }

    public LocalDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(LocalDateTime finishedAt) { this.finishedAt = finishedAt; }
}
