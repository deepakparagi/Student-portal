package edu.smartstudy.planning;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface StudyTaskRepository extends JpaRepository<StudyTask, Long> {
    List<StudyTask> findTop100ByStudentIdOrderByScheduledDateAscCreatedAtDesc(Long studentId);
    long countByStudentId(Long studentId);
    long countByStudentIdAndStatus(Long studentId, String status);
    long countByStatus(String status);
    Optional<StudyTask> findByIdAndStudentId(Long id, Long studentId);
    List<StudyTask> findByStudentIdOrderByScheduledDateAscCreatedAtDesc(Long studentId);

    @Modifying
    @Transactional
    @Query("DELETE FROM StudyTask t WHERE t.studentId = :studentId")
    void deleteByStudentId(Long studentId);
}
