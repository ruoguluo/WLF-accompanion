package llm

import (
    "bytes"
    "encoding/json"
    "net/http"
    "time"
)

func (c *Client) ExtractInfo(text string, source string) (*Profile, error) {
    prompt := createPrompt(text, source)
    body := map[string]any{
        "model": c.model,
        "messages": []map[string]string{
            {"role": "user", "content": prompt},
        },
        "temperature": 0.1,
        "max_tokens": 2000,
        "response_format": map[string]string{"type": "json_object"},
    }
    b, _ := json.Marshal(body)
    req, _ := http.NewRequest("POST", "https://openrouter.ai/api/v1/chat/completions", bytes.NewReader(b))
    req.Header.Set("Authorization", "Bearer "+c.apiKey)
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("HTTP-Referer", "http://localhost:5173")
    req.Header.Set("X-Title", "Resume Analyzer")
    httpClient := &http.Client{Timeout: 20 * time.Second}
    resp, err := httpClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    var out struct {
        Choices []struct {
            Message struct {
                Content string `json:"content"`
            } `json:"message"`
        } `json:"choices"`
    }
    json.NewDecoder(resp.Body).Decode(&out)
    content := "{}"
    if len(out.Choices) > 0 {
        content = out.Choices[0].Message.Content
    }
    var p struct {
        PersonalInfo PersonalInfo `json:"personalInfo"`
        Education []Education `json:"education"`
        Experience []Experience `json:"experience"`
        Skills []string `json:"skills"`
        Summary string `json:"summary"`
        TopCompetences []string `json:"topCompetences"`
        TopAchievements []string `json:"topAchievements"`
        StudyWorkAlignment string `json:"studyWorkAlignment"`
        Industry string `json:"industry"`
        ExperienceDuration string `json:"experienceDuration"`
    }
    json.Unmarshal([]byte(content), &p)
    prof := &Profile{
        PersonalInfo: p.PersonalInfo,
        Education: p.Education,
        Experience: p.Experience,
        Skills: p.Skills,
        Summary: truncateWords(p.Summary, 1000),
        ExtractedAt: time.Now().UTC().Format(time.RFC3339),
        Source: source,
        TopCompetences: p.TopCompetences,
        TopAchievements: p.TopAchievements,
        StudyWorkAlignment: p.StudyWorkAlignment,
        Industry: p.Industry,
        ExperienceDuration: p.ExperienceDuration,
    }
    return prof, nil
}