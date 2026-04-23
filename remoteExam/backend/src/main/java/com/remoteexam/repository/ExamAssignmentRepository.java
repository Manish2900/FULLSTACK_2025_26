package com.remoteexam.repository;

import com.remoteexam.model.ExamAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExamAssignmentRepository extends JpaRepository<ExamAssignment, UUID> {
    List<ExamAssignment> findByProctorId(UUID proctorId);
    List<ExamAssignment> findByStudentId(UUID studentId);
}
