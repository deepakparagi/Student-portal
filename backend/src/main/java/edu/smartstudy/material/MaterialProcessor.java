package edu.smartstudy.material;

import java.nio.file.Path;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import reactor.netty.http.client.HttpClient;
import java.time.Duration;
import reactor.core.publisher.Mono;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class MaterialProcessor {
    private final MaterialRepository materials;
    private final MaterialChunkRepository chunkRepo;
    private final WebClient ml;
    private final ObjectMapper json;
    private final Path uploadDir;
    private final String mlInternalToken;

    public MaterialProcessor(MaterialRepository materials, MaterialChunkRepository chunkRepo,
                             @Value("${app.ml-url}") String mlUrl,
                             @Value("${app.ml-internal-token}") String mlInternalToken,
                             @Value("${app.upload-dir}") String dir,
                             ObjectMapper json) {
        this.materials = materials;
        this.chunkRepo = chunkRepo;
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(300));
        this.ml = WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .baseUrl(mlUrl)
                .defaultHeader("X-Internal-Token", mlInternalToken)
                .build();
        this.json = json;
        this.uploadDir = Path.of(dir).toAbsolutePath().normalize();
        this.mlInternalToken = mlInternalToken;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void resumeProcessingAfterRestart() {
        materials.findByStatus("PROCESSING").forEach(m ->
                java.util.concurrent.CompletableFuture.runAsync(() -> processNow(m.getId(), uploadDir.resolve(m.storageKey())))
        );
    }

    public void process(Long id, Path file) {
        java.util.concurrent.CompletableFuture.runAsync(() -> processNow(id, file));
    }

    private void processNow(Long id, Path file) {
        Material material = materials.findById(id).orElse(null);
        if (material == null) return;
        try {
            String fileName = material.getFileName();
            byte[] fileBytes = java.nio.file.Files.readAllBytes(file);

            System.err.println("[MaterialProcessor] Uploading file: " + fileName + " from path: " + file);
            System.err.println("[MaterialProcessor] File size: " + fileBytes.length);

            // Extract text and chunks using WebClient
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return fileName;
                }
            }).filename(fileName);

            Map<?, ?> extracted = ml.post()
                    .uri("/ml/v1/extract")
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            System.err.println("[MaterialProcessor] Extract response: " + extracted);

            String text = Objects.toString(extracted.get("text"), "");
            String fileType = Objects.toString(extracted.get("file_type"), "unknown");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> chunks = (List<Map<String, Object>>) extracted.get("chunks");
            @SuppressWarnings("unchecked")
            List<String> warnings = (List<String>) extracted.get("extraction_warnings");

            if (warnings != null && !warnings.isEmpty()) {
                warnings.forEach(w -> System.err.println("[MaterialProcessor] Extraction warning: " + w));
            }

            // Persist chunks to MySQL (for backward compatibility and exact text retrieval)
            if (chunks != null) {
                persistChunks(id, chunks);
            }

            // Index chunks in ChromaDB vector store for semantic search
            if (chunks != null && !chunks.isEmpty()) {
                indexChunksInVectorStore(id, chunks, fileType, fileName);
            }

            // Summarize
            Map<?, ?> summary = ml.post()
                    .uri("/ml/v1/summarize")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("text", text, "material_id", id, "style", "detailed"))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            // Topics
            Map<?, ?> topics = ml.post()
                    .uri("/ml/v1/topics")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("text", text))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            // Keywords
            Map<?, ?> keywords = ml.post()
                    .uri("/ml/v1/keywords")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("text", text))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            material.complete(text,
                    Objects.toString(summary.get("summary"), ""),
                    json.writeValueAsString(topics.get("topics")),
                    json.writeValueAsString(keywords.get("keywords")));
            materials.save(material);

            System.err.println("[MaterialProcessor] Successfully processed material " + id);
        } catch (Exception e) {
            System.err.println("[MaterialProcessor] Error processing material " + id + ": " + e.getMessage());
            e.printStackTrace(System.err);
            material.fail("Processing could not be completed: " + e.getMessage());
            materials.save(material);
        }
    }

    public void deleteVectorIndex(Long materialId) {
        try {
            ml.delete()
                    .uri("/ml/v1/index-material/" + materialId)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            System.err.println("[MaterialProcessor] Successfully deleted vector index for material " + materialId);
        } catch (Exception e) {
            System.err.println("[MaterialProcessor] Failed to delete vector index for material " + materialId + ": " + e.getMessage());
        }
    }

    private void indexChunksInVectorStore(Long materialId, List<Map<String, Object>> chunks, String fileType, String fileName) {
        try {
            Map<?, ?> result = ml.post()
                    .uri("/ml/v1/index-material")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                            "material_id", materialId,
                            "chunks", chunks,
                            "file_type", fileType,
                            "filename", fileName
                    ))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            System.err.println("[MaterialProcessor] Vector index result: " + result);
        } catch (Exception e) {
            System.err.println("[MaterialProcessor] Vector indexing failed for material " + materialId + ": " + e.getMessage());
            // Don't fail the whole processing if vector indexing fails
            e.printStackTrace(System.err);
        }
    }

    private void persistChunks(Long materialId, List<Map<String, Object>> chunks) {
        // Delete existing chunks for this material
        chunkRepo.deleteByMaterialId(materialId);

        List<MaterialChunk> entities = new ArrayList<>();
        for (Map<String, Object> chunk : chunks) {
            Integer ordinal = (Integer) chunk.get("ordinal");
            if (ordinal == null) {
                // Fallback: assign sequential ordinal
                ordinal = entities.size();
            }
            Integer page = (Integer) chunk.get("page");
            String heading = (String) chunk.get("heading");
            String text = Objects.toString(chunk.get("text"), "");
            Integer tokenCount = (Integer) chunk.get("token_count");
            if (tokenCount == null) {
                tokenCount = text.length() / 4; // rough estimate
            }

            MaterialChunk entity = new MaterialChunk(materialId, ordinal, page, heading, text, tokenCount);
            entities.add(entity);
        }
        chunkRepo.saveAll(entities);
    }
}