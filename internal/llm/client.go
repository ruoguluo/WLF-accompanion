package llm

import (
    "strings"
)

type PersonalInfo struct {
    Name     string `json:"name"`
    Email    string `json:"email,omitempty"`
    Phone    string `json:"phone,omitempty"`
    Location string `json:"location,omitempty"`
    Linkedin string `json:"linkedin,omitempty"`
}

type Education struct {
    Institution string `json:"institution"`
    Degree      string `json:"degree"`
    Field       string `json:"field"`
    StartDate   string `json:"startDate"`
    EndDate     string `json:"endDate"`
    GPA         string `json:"gpa,omitempty"`
}

type Experience struct {
    Company     string `json:"company"`
    Position    string `json:"position"`
    StartDate   string `json:"startDate"`
    EndDate     string `json:"endDate"`
    Description string `json:"description"`
    Location    string `json:"location,omitempty"`
}

type Profile struct {
    PersonalInfo       PersonalInfo  `json:"personalInfo"`
    Education          []Education   `json:"education"`
    Experience         []Experience  `json:"experience"`
    Skills             []string      `json:"skills"`
    Summary            string        `json:"summary,omitempty"`
    ExtractedAt        string        `json:"extractedAt"`
    Source             string        `json:"source"`
    TopCompetences     []string      `json:"topCompetences,omitempty"`
    TopAchievements    []string      `json:"topAchievements,omitempty"`
    StudyWorkAlignment string        `json:"studyWorkAlignment,omitempty"`
    Industry           string        `json:"industry,omitempty"`
    ExperienceDuration string        `json:"experienceDuration,omitempty"`
}

type Client struct {
    apiKey string
    model  string
}

func NewClient(apiKey, model string) *Client {
    if model == "" {
        model = "deepseek/deepseek-chat"
    }
    return &Client{apiKey: apiKey, model: model}
}


func truncateWords(s string, max int) string {
    if s == "" { return s }
    parts := stringsFields(s)
    if len(parts) <= max { return s }
    return stringsJoin(parts[:max], " ") + "…"
}

func stringsFields(s string) []string { return strings.Fields(s) }
func stringsJoin(a []string, sep string) string { return strings.Join(a, sep) }

func createPrompt(text, source string) string {
    return "You are an expert resume parser. Extract structured information from the following " + source + " text and return it as a valid JSON object.\n\nText to analyze:\n\"\"\"\n" + text + "\n\"\"\"\n\nExtract the following information:\n\n1. Personal Information (object): name, email, phone, location, linkedin\n2. Education (array): institution, degree, field, startDate, endDate, gpa\n3. Experience (array): company, position, startDate, endDate, description, location\n4. Skills (array of strings)\n5. Summary (string, up to 1000 words)\n6. Top Competences (array of 5 strings)\n7. Top Achievements (array of 5 strings)\n8. Study-Work Alignment (string: Related | Partially Related | Not Related)\n9. Industry (string): concise industry label inferred from roles, companies, and skills (e.g., Technology, Finance)\n10. ExperienceDuration (string): total professional experience across roles (e.g., \"5 years 3 months\"). If unknown, use \"Unknown\"\n\nIMPORTANT:\n- Return ONLY valid JSON with the exact field names above\n- Use consistent date formats (YYYY-MM or YYYY)\n- Use \"Present\" for current roles\n- If a field is missing, either omit or use null/\"Unknown\" as appropriate"
}
