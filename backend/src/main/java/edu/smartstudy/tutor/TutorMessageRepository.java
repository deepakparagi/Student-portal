package edu.smartstudy.tutor;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface TutorMessageRepository extends JpaRepository<TutorMessage, Long> {
    List<TutorMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    @Modifying
    @Transactional
    @Query("DELETE FROM TutorMessage m WHERE m.conversationId = :conversationId")
    void deleteByConversationId(Long conversationId);

    @Modifying
    @Transactional
    @Query("DELETE FROM TutorMessage m WHERE m.conversationId IN :conversationIds")
    void deleteByConversationIdIn(List<Long> conversationIds);
}
