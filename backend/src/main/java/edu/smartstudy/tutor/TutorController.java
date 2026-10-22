package edu.smartstudy.tutor;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.smartstudy.material.Material;
import edu.smartstudy.material.MaterialRepository;
import edu.smartstudy.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

@RestController
@RequestMapping("/api/v1/tutor")
public class TutorController {
    private final TutorConversationRepository conversations;
    private final TutorMessageRepository messages;
    private final MaterialRepository materials;
    private final UserRepository users;
    private final RestClient ml;
    private final ObjectMapper json;
    private final String defaultOpenRouterApiKey;

    public TutorController(TutorConversationRepository conversations,
                           TutorMessageRepository messages,
                           MaterialRepository materials,
                           UserRepository users,
                           @Value("${app.ml-url}") String mlUrl,
                           @Value("${app.ml-internal-token:dev-internal-token-change-me}") String mlInternalToken,
                           @Value("${app.openrouter-api-key:}") String defaultOpenRouterApiKey,
                           ObjectMapper json) {
        this.conversations = conversations;
        this.messages = messages;
        this.materials = materials;
        this.users = users;
        this.defaultOpenRouterApiKey = defaultOpenRouterApiKey;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(30));
        factory.setReadTimeout(Duration.ofSeconds(300));
        this.ml = RestClient.builder()
                .requestFactory(factory)
                .baseUrl(mlUrl)
                .defaultHeader("X-Internal-Token", mlInternalToken)
                .build();
        this.json = json;
    }

    private Long owner(Authentication a) {
        return users.findByEmailIgnoreCase(a.getName()).orElseThrow().getId();
    }

    public record AskRequest(
            @NotBlank @Size(max = 4000) String question,
            Long materialId,
            Long conversationId,
            Boolean grounded,
            String model
    ) {}

    public record GroundedAskRequest(
            @NotBlank @Size(max = 4000) String question,
            List<Long> materialIds,
            Long conversationId,
            String model
    ) {}

    @GetMapping("/conversations")
    public List<TutorConversation> list(Authentication a) {
        return conversations.findTop50ByOwnerIdOrderByCreatedAtDesc(owner(a));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id, Authentication a) {
        Long user = owner(a);
        return conversations.findByIdAndOwnerId(id, user).<ResponseEntity<?>>map(c ->
                ResponseEntity.ok(Map.of(
                        "conversation", c,
                        "messages", messages.findByConversationIdOrderByCreatedAtAsc(id).stream().map(this::messageView).toList()
                ))
        ).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/conversations/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteConversation(@PathVariable Long id, Authentication a) {
        Long student = owner(a);
        return conversations.findByIdAndOwnerId(id, student).<ResponseEntity<?>>map(c -> {
            messages.deleteByConversationId(id);
            conversations.delete(c);
            return ResponseEntity.noContent().build();
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/conversations")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> clearAllConversations(Authentication a) {
        Long student = owner(a);
        List<TutorConversation> list = conversations.findByOwnerId(student);
        if (!list.isEmpty()) {
            List<Long> ids = list.stream().map(TutorConversation::getId).toList();
            messages.deleteByConversationIdIn(ids);
            conversations.deleteAll(list);
        }
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> messageView(TutorMessage m) {
        try {
            return Map.of(
                    "id", m.getId(),
                    "role", m.getRole(),
                    "content", m.getContent(),
                    "sources", m.getSourcesJson() == null ? List.of() : json.readValue(m.getSourcesJson(), new TypeReference<List<Map<String, Object>>>() {}),
                    "createdAt", m.getCreatedAt()
            );
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    @PostMapping("/ask")
    public ResponseEntity<?> ask(
            @RequestBody @Valid AskRequest input,
            @RequestHeader(value = "X-OpenRouter-Api-Key", required = false) String clientOpenRouterApiKey,
            @RequestHeader(value = "X-LLM-Api-Key", required = false) String clientLlmApiKey,
            @RequestHeader(value = "X-LLM-Model", required = false) String clientLlmModel,
            Authentication a
    ) throws Exception {
        Long student = owner(a);

        String clientApiKey = (clientOpenRouterApiKey != null && !clientOpenRouterApiKey.isBlank())
                ? clientOpenRouterApiKey.trim()
                : (clientLlmApiKey != null && !clientLlmApiKey.isBlank())
                    ? clientLlmApiKey.trim()
                    : (defaultOpenRouterApiKey != null && !defaultOpenRouterApiKey.isBlank())
                        ? defaultOpenRouterApiKey.trim()
                        : null;

        String selectedModel = (input.model() != null && !input.model().isBlank())
                ? input.model().trim()
                : (clientLlmModel != null && !clientLlmModel.isBlank())
                    ? clientLlmModel.trim()
                    : "smartstudy-tutor";

        String contextText = null;
        String materialTitle = null;
        boolean useGrounded = input.grounded() != null && input.grounded();
        List<Long> targetMaterialIds = new ArrayList<>();

        if (input.materialId() != null && input.materialId() > 0) {
            Material material = materials.findByIdAndOwnerId(input.materialId(), student).orElse(null);
            if (material == null) {
                return ResponseEntity.notFound().build();
            }
            if ("PROCESSING".equals(material.getStatus())) {
                for (int waitCount = 0; waitCount < 30; waitCount++) {
                    try { Thread.sleep(500); } catch (InterruptedException ignored) {}
                    material = materials.findByIdAndOwnerId(input.materialId(), student).orElse(null);
                    if (material != null && "COMPLETED".equals(material.getStatus()) && material.getExtractedText() != null) {
                        break;
                    }
                }
            }
            if (!"COMPLETED".equals(material.getStatus()) || material.getExtractedText() == null) {
                return ResponseEntity.status(409).body(Map.of("error", "The selected note is still processing. Please wait a few moments or choose a completed document."));
            }
            contextText = material.getExtractedText();
            materialTitle = material.getTitle();
            targetMaterialIds.add(material.getId());
            useGrounded = true;
        } else {
            List<Material> studentMaterials = materials.findByOwnerIdAndStatusIn(student, List.of("COMPLETED"));
            for (Material sm : studentMaterials) {
                if (sm.getExtractedText() != null && !sm.getExtractedText().isBlank()) {
                    targetMaterialIds.add(sm.getId());
                }
            }
            if (!targetMaterialIds.isEmpty()) {
                useGrounded = true;
            }
        }

        TutorConversation conversation;
        if (input.conversationId() == null) {
            String title = input.question().trim();
            if (title.length() > 100) title = title.substring(0, 100) + "...";
            conversation = conversations.save(new TutorConversation(student, title));
        } else {
            conversation = conversations.findByIdAndOwnerId(input.conversationId(), student).orElse(null);
            if (conversation == null) {
                return ResponseEntity.notFound().build();
            }
        }

        // Fetch recent conversation history turns
        List<TutorMessage> prevMessages = messages.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        List<Map<String, String>> historyList = new ArrayList<>();
        for (TutorMessage pm : prevMessages) {
            String role = "USER".equalsIgnoreCase(pm.getRole()) ? "user" : "assistant";
            historyList.add(Map.of("role", role, "content", pm.getContent()));
        }

        // Save student question
        messages.save(new TutorMessage(conversation.getId(), "USER", input.question().trim(), null));

        Map<?, ?> chatResponse;
        try {
            if (useGrounded && !targetMaterialIds.isEmpty()) {
                // Use RAG endpoint for grounded Q&A across student materials
                Map<String, Object> ragPayload = new HashMap<>();
                ragPayload.put("question", input.question().trim());
                ragPayload.put("material_ids", targetMaterialIds);
                ragPayload.put("conversation_history", historyList);
                ragPayload.put("k", 8);
                ragPayload.put("model", selectedModel);
                if (contextText != null) {
                    ragPayload.put("document_text", contextText);
                    ragPayload.put("material_title", materialTitle);
                }
                if (clientApiKey != null) {
                    ragPayload.put("api_key", clientApiKey);
                }

                var reqBuilder = ml.post().uri("/ml/v1/rag-query")
                        .contentType(MediaType.APPLICATION_JSON);
                if (clientApiKey != null) {
                    reqBuilder.header("X-OpenRouter-Api-Key", clientApiKey);
                    reqBuilder.header("X-LLM-Api-Key", clientApiKey);
                }
                chatResponse = reqBuilder.body(ragPayload).retrieve().body(Map.class);
            } else {
                // Use general chat endpoint
                Map<String, Object> chatPayload = new HashMap<>();
                chatPayload.put("question", input.question().trim());
                chatPayload.put("messages", historyList);
                chatPayload.put("model", selectedModel);
                if (contextText != null) {
                    chatPayload.put("context", contextText);
                    chatPayload.put("material_title", materialTitle);
                }
                if (clientApiKey != null) {
                    chatPayload.put("api_key", clientApiKey);
                }

                var reqBuilder = ml.post().uri("/ml/v1/chat")
                        .contentType(MediaType.APPLICATION_JSON);
                if (clientApiKey != null) {
                    reqBuilder.header("X-OpenRouter-Api-Key", clientApiKey);
                    reqBuilder.header("X-LLM-Api-Key", clientApiKey);
                }
                chatResponse = reqBuilder.body(chatPayload).retrieve().body(Map.class);
            }
        } catch (org.springframework.web.client.RestClientResponseException e) {
            int statusCode = e.getStatusCode().value();
            if (statusCode == 422) {
                return ResponseEntity.status(422).body(Map.of("error", "Invalid question format: question cannot be empty.", "code", "VALIDATION_ERROR"));
            } else if (statusCode == 400) {
                return ResponseEntity.status(400).body(Map.of("error", "Model error: " + e.getResponseBodyAsString(), "code", "MODEL_ERROR"));
            } else if (statusCode == 504) {
                return ResponseEntity.status(504).body(Map.of("error", "The inference request timed out.", "code", "TIMEOUT_ERROR"));
            }
            return ResponseEntity.status(statusCode).body(Map.of("error", "AI service returned status " + statusCode, "code", "SERVICE_UNAVAILABLE"));
        } catch (Exception e) {
            // Fallback to semantic-search if chat endpoint is busy
            try {
                if (contextText != null) {
                    Map<?, ?> found = ml.post().uri("/ml/v1/semantic-search")
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(Map.of("question", input.question(), "context", contextText))
                            .retrieve().body(Map.class);
                    List<Map<String, Object>> hits = json.convertValue(found.get("matches"), new TypeReference<>() {});
                    String passage = (hits != null && !hits.isEmpty()) ? Objects.toString(hits.get(0).get("text"), "") : "No passage found.";
                    chatResponse = Map.of(
                            "answer", "Here is what I found in your notes:\n\n> " + passage,
                            "sources", hits != null ? hits : List.of(),
                            "model", selectedModel
                    );
                } else {
                    return ResponseEntity.status(503).body(Map.of("error", "The AI Tutor service is temporarily unavailable: " + e.getMessage(), "code", "SERVICE_UNAVAILABLE"));
                }
            } catch (Exception ex) {
                return ResponseEntity.status(503).body(Map.of("error", "The AI Tutor service is temporarily unavailable.", "code", "SERVICE_UNAVAILABLE"));
            }
        }

        String answerText = chatResponse != null && chatResponse.get("answer") != null
                ? chatResponse.get("answer").toString()
                : "No response generated.";

        Object sourcesObj = chatResponse != null ? chatResponse.get("sources") : List.of();
        String sourcesJson = sourcesObj != null ? json.writeValueAsString(sourcesObj) : "[]";

        messages.save(new TutorMessage(conversation.getId(), "TUTOR", answerText, sourcesJson));

        return ResponseEntity.ok(Map.of(
                "conversationId", conversation.getId(),
                "messages", messages.findByConversationIdOrderByCreatedAtAsc(conversation.getId()).stream().map(this::messageView).toList(),
                "model", chatResponse != null && chatResponse.get("model") != null ? chatResponse.get("model").toString() : selectedModel,
                "grounded", useGrounded
        ));
    }

    @PostMapping("/ask-grounded")
    public ResponseEntity<?> askGrounded(
            @RequestBody @Valid GroundedAskRequest input,
            @RequestHeader(value = "X-OpenRouter-Api-Key", required = false) String clientOpenRouterApiKey,
            @RequestHeader(value = "X-LLM-Api-Key", required = false) String clientLlmApiKey,
            @RequestHeader(value = "X-LLM-Model", required = false) String clientLlmModel,
            Authentication a
    ) throws Exception {
        Long student = owner(a);

        String clientApiKey = (clientOpenRouterApiKey != null && !clientOpenRouterApiKey.isBlank())
                ? clientOpenRouterApiKey.trim()
                : (clientLlmApiKey != null && !clientLlmApiKey.isBlank())
                    ? clientLlmApiKey.trim()
                    : (defaultOpenRouterApiKey != null && !defaultOpenRouterApiKey.isBlank())
                        ? defaultOpenRouterApiKey.trim()
                        : null;

        String selectedModel = (input.model() != null && !input.model().isBlank())
                ? input.model().trim()
                : (clientLlmModel != null && !clientLlmModel.isBlank())
                    ? clientLlmModel.trim()
                    : "smartstudy-tutor";

        // Validate material access
        List<Long> validMaterialIds = new ArrayList<>();
        StringBuilder combinedDocText = new StringBuilder();
        String primaryTitle = null;

        if (input.materialIds() != null && !input.materialIds().isEmpty()) {
            for (Long mid : input.materialIds()) {
                Material material = materials.findByIdAndOwnerId(mid, student).orElse(null);
                if (material != null && "PROCESSING".equals(material.getStatus())) {
                    for (int waitCount = 0; waitCount < 30; waitCount++) {
                        try { Thread.sleep(500); } catch (InterruptedException ignored) {}
                        material = materials.findByIdAndOwnerId(mid, student).orElse(null);
                        if (material != null && "COMPLETED".equals(material.getStatus()) && material.getExtractedText() != null) {
                            break;
                        }
                    }
                }
                if (material != null && "COMPLETED".equals(material.getStatus()) && material.getExtractedText() != null) {
                    validMaterialIds.add(mid);
                    if (primaryTitle == null) primaryTitle = material.getTitle();
                    if (combinedDocText.length() < 24000) {
                        combinedDocText.append("\n--- ").append(material.getTitle()).append(" ---\n")
                                .append(material.getExtractedText());
                    }
                }
            }
        }

        if (validMaterialIds.isEmpty() && (input.materialIds() == null || input.materialIds().isEmpty())) {
            List<Material> allCompleted = materials.findByOwnerIdAndStatusIn(student, List.of("COMPLETED"));
            for (Material m : allCompleted) {
                if (m.getExtractedText() != null && !m.getExtractedText().isBlank()) {
                    validMaterialIds.add(m.getId());
                    if (primaryTitle == null) primaryTitle = m.getTitle();
                    if (combinedDocText.length() < 24000) {
                        combinedDocText.append("\n--- ").append(m.getTitle()).append(" ---\n")
                                .append(m.getExtractedText());
                    }
                }
            }
        }

        if (validMaterialIds.isEmpty()) {
            return ResponseEntity.status(409).body(Map.of("error", "No valid completed documents selected for grounded Q&A."));
        }

        TutorConversation conversation;
        if (input.conversationId() == null) {
            String title = input.question().trim();
            if (title.length() > 100) title = title.substring(0, 100) + "...";
            conversation = conversations.save(new TutorConversation(student, title));
        } else {
            conversation = conversations.findByIdAndOwnerId(input.conversationId(), student).orElse(null);
            if (conversation == null) {
                return ResponseEntity.notFound().build();
            }
        }

        // Fetch recent conversation history turns
        List<TutorMessage> prevMessages = messages.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        List<Map<String, String>> historyList = new ArrayList<>();
        for (TutorMessage pm : prevMessages) {
            String role = "USER".equalsIgnoreCase(pm.getRole()) ? "user" : "assistant";
            historyList.add(Map.of("role", role, "content", pm.getContent()));
        }

        // Save student question
        messages.save(new TutorMessage(conversation.getId(), "USER", input.question().trim(), null));

        // Call RAG endpoint
        Map<?, ?> chatResponse;
        try {
            Map<String, Object> ragPayload = new HashMap<>();
            ragPayload.put("question", input.question().trim());
            ragPayload.put("material_ids", validMaterialIds);
            ragPayload.put("conversation_history", historyList);
            ragPayload.put("k", 8);
            ragPayload.put("model", selectedModel);
            if (!combinedDocText.isEmpty()) {
                ragPayload.put("document_text", combinedDocText.toString());
                ragPayload.put("material_title", primaryTitle);
            }
            if (clientApiKey != null) {
                ragPayload.put("api_key", clientApiKey);
            }

            var reqBuilder = ml.post().uri("/ml/v1/rag-query")
                    .contentType(MediaType.APPLICATION_JSON);
            if (clientApiKey != null) {
                reqBuilder.header("X-OpenRouter-Api-Key", clientApiKey);
                reqBuilder.header("X-LLM-Api-Key", clientApiKey);
            }
            chatResponse = reqBuilder.body(ragPayload).retrieve().body(Map.class);
        } catch (org.springframework.web.client.RestClientResponseException e) {
            int statusCode = e.getStatusCode().value();
            if (statusCode == 422) {
                return ResponseEntity.status(422).body(Map.of("error", "Invalid question format: question cannot be empty.", "code", "VALIDATION_ERROR"));
            } else if (statusCode == 400) {
                return ResponseEntity.status(400).body(Map.of("error", "Model error: " + e.getResponseBodyAsString(), "code", "MODEL_ERROR"));
            } else if (statusCode == 504) {
                return ResponseEntity.status(504).body(Map.of("error", "The inference request timed out.", "code", "TIMEOUT_ERROR"));
            }
            return ResponseEntity.status(statusCode).body(Map.of("error", "AI service returned status " + statusCode, "code", "SERVICE_UNAVAILABLE"));
        } catch (Exception e) {
            System.err.println("[TutorController] Error calling /ml/v1/rag-query: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(503).body(Map.of("error", "The AI Tutor service is temporarily unavailable: " + e.getMessage(), "code", "SERVICE_UNAVAILABLE"));
        }

        String answerText = chatResponse != null && chatResponse.get("answer") != null
                ? chatResponse.get("answer").toString()
                : "No response generated.";

        Object sourcesObj = chatResponse != null ? chatResponse.get("sources") : List.of();
        String sourcesJson = sourcesObj != null ? json.writeValueAsString(sourcesObj) : "[]";
        boolean grounded = sourcesObj instanceof Collection<?> sources && !sources.isEmpty();

        messages.save(new TutorMessage(conversation.getId(), "TUTOR", answerText, sourcesJson));

        return ResponseEntity.ok(Map.of(
                "conversationId", conversation.getId(),
                "messages", messages.findByConversationIdOrderByCreatedAtAsc(conversation.getId()).stream().map(this::messageView).toList(),
                "model", chatResponse != null && chatResponse.get("model") != null ? chatResponse.get("model").toString() : selectedModel,
                "grounded", grounded
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        try {
            Map<?, ?> health = ml.get().uri("/ml/v1/health").retrieve().body(Map.class);
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("status", "unhealthy", "error", e.getMessage()));
        }
    }
}
