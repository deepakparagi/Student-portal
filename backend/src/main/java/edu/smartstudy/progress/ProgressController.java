package edu.smartstudy.progress;

import edu.smartstudy.focus.*;
import edu.smartstudy.planning.*;
import edu.smartstudy.quiz.*;
import edu.smartstudy.user.UserRepository;
import java.time.*;
import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/progress", "/api/v1/analytics"})
public class ProgressController {
    private final UserRepository users;
    private final StudyTaskRepository tasks;
    private final FocusSessionRepository focus;
    private final QuizAttemptRepository attempts;

    public ProgressController(UserRepository users, StudyTaskRepository tasks, FocusSessionRepository focus, QuizAttemptRepository attempts) {
        this.users = users;
        this.tasks = tasks;
        this.focus = focus;
        this.attempts = attempts;
    }

    @GetMapping({"/overview", "/summary"})
    public Map<String, Object> overview(Authentication auth) {
        Long id = users.findByEmailIgnoreCase(auth.getName()).orElseThrow().getId();
        long totalTasks = tasks.countByStudentId(id);
        long done = tasks.countByStudentIdAndStatus(id, "COMPLETED");
        List<QuizAttempt> history = attempts.findTop100ByStudentIdOrderBySubmittedAtDesc(id);
        int scored = history.stream().mapToInt(QuizAttempt::getScore).sum();
        int questions = history.stream().mapToInt(QuizAttempt::getTotalQuestions).sum();

        long totalSecs = focus.totalSeconds(id);

        // Include real-time active / ongoing focus session
        Optional<FocusSession> activeSess = focus.findFirstByStudentIdAndStatusInOrderByStartedAtDesc(id, List.of("ACTIVE", "PAUSED"));
        boolean isFocusingNow = false;
        long activeSessionSeconds = 0;
        String activeStatus = "NONE";
        Long activeId = null;
        if (activeSess.isPresent()) {
            FocusSession s = activeSess.get();
            activeId = s.getId();
            activeStatus = s.getStatus();
            long ongoingSecs = s.getDurationSeconds();
            if ("ACTIVE".equals(s.getStatus()) && s.getActiveSince() != null) {
                long elapsed = Math.max(0, Duration.between(s.getActiveSince(), Instant.now()).getSeconds());
                ongoingSecs += Math.min(elapsed, 14400); // 4-hour safety cap
                isFocusingNow = true;
            }
            activeSessionSeconds = ongoingSecs;
            totalSecs += ongoingSecs;
        }

        long totalMins = totalSecs > 0 && totalSecs < 60 ? 1 : (totalSecs / 60);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("totalStudyMinutes", totalMins);
        res.put("totalStudySeconds", totalSecs);
        res.put("isFocusingNow", isFocusingNow);
        res.put("activeSessionSeconds", activeSessionSeconds);
        res.put("activeSessionStatus", activeStatus);
        res.put("activeSessionId", activeId != null ? activeId : 0L);
        res.put("completedTasks", done);
        res.put("totalTasks", totalTasks);
        res.put("taskCompletionPercent", totalTasks == 0 ? 0 : Math.round(100.0 * done / totalTasks));
        res.put("quizAttempts", history.size());
        res.put("quizAccuracyPercent", questions == 0 ? 0 : Math.round(100.0 * scored / questions));
        return res;
    }

    @GetMapping("/trends")
    public Map<String, Object> trends(Authentication auth) {
        Long id = users.findByEmailIgnoreCase(auth.getName()).orElseThrow().getId();
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);
        Instant from = today.minusDays(6).atStartOfDay(zone).toInstant();

        Map<LocalDate, Long> daySeconds = new TreeMap<>();
        for (int i = 0; i < 7; i++) {
            daySeconds.put(today.minusDays(6 - i), 0L);
        }

        for (FocusSession s : focus.findByStudentIdAndStartedAtGreaterThanEqualOrderByStartedAtAsc(id, from)) {
            if (s.getStartedAt() != null) {
                LocalDate day = s.getStartedAt().atZone(zone).toLocalDate();
                long sSecs = s.getDurationSeconds();
                if ("ACTIVE".equals(s.getStatus()) && s.getActiveSince() != null) {
                    long elapsed = Math.max(0, Duration.between(s.getActiveSince(), Instant.now()).getSeconds());
                    sSecs += Math.min(elapsed, 14400);
                }
                final long secsToAdd = sSecs;
                daySeconds.computeIfPresent(day, (k, v) -> v + secsToAdd);
            }
        }

        Map<LocalDate, Long> minutes = new TreeMap<>();
        for (Map.Entry<LocalDate, Long> entry : daySeconds.entrySet()) {
            long secs = entry.getValue();
            long mins = secs > 0 && secs < 60 ? 1L : (secs / 60);
            minutes.put(entry.getKey(), mins);
        }

        Map<LocalDate, Long> completions = new TreeMap<>();
        Map<LocalDate, Long> quizScores = new TreeMap<>();
        Map<LocalDate, Long> quizTotals = new TreeMap<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = today.minusDays(6 - i);
            completions.put(date, 0L);
            quizScores.put(date, 0L);
            quizTotals.put(date, 0L);
        }

        for (StudyTask task : tasks.findTop100ByStudentIdOrderByScheduledDateAscCreatedAtDesc(id)) {
            if (task.getCompletedAt() != null) {
                LocalDate day = task.getCompletedAt().atZone(zone).toLocalDate();
                completions.computeIfPresent(day, (k, v) -> v + 1);
            }
        }

        for (QuizAttempt attempt : attempts.findTop100ByStudentIdOrderBySubmittedAtDesc(id)) {
            if (attempt.getSubmittedAt() != null) {
                LocalDate day = attempt.getSubmittedAt().atZone(zone).toLocalDate();
                quizScores.computeIfPresent(day, (k, v) -> v + attempt.getScore());
                quizTotals.computeIfPresent(day, (k, v) -> v + attempt.getTotalQuestions());
            }
        }

        List<Map<String, Object>> quizAccuracy = new ArrayList<>();
        for (LocalDate date : quizTotals.keySet()) {
            long total = quizTotals.get(date);
            long score = quizScores.get(date);
            Map<String, Object> item = new HashMap<>();
            item.put("date", date.toString());
            if (total > 0) {
                item.put("percent", Math.round(100.0 * score / total));
                item.put("questions", total);
            }
            quizAccuracy.add(item);
        }

        return Map.of(
            "studyMinutes", minutes.entrySet().stream().map(e -> Map.of(
                "date", e.getKey().toString(),
                "minutes", e.getValue(),
                "seconds", daySeconds.getOrDefault(e.getKey(), 0L)
            )).toList(),
            "taskCompletions", completions.entrySet().stream().map(e -> Map.of("date", e.getKey().toString(), "completed", e.getValue())).toList(),
            "quizAccuracy", quizAccuracy
        );
    }
}
