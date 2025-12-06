package store

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
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

type MentorProfile struct {
	ID                 string       `json:"id"`
	PersonalInfo       PersonalInfo `json:"personalInfo"`
	Education          []Education  `json:"education"`
	Experience         []Experience `json:"experience"`
	Skills             []string     `json:"skills"`
	Summary            string       `json:"summary,omitempty"`
	ExtractedAt        string       `json:"extractedAt"`
	Source             string       `json:"source"`
	TopCompetences     []string     `json:"topCompetences,omitempty"`
	TopAchievements    []string     `json:"topAchievements,omitempty"`
	StudyWorkAlignment string       `json:"studyWorkAlignment,omitempty"`
	Certificates       []string     `json:"certificates,omitempty"`
}

type mentorsDB struct {
	Mentors []MentorProfile `json:"mentors"`
}

var mu sync.Mutex

func dbPath() string {
	return filepath.Join("api", "data", "mentors.json")
}

func ensure() {
	p := dbPath()
	os.MkdirAll(filepath.Dir(p), 0755)
	if _, err := os.Stat(p); os.IsNotExist(err) {
		b, _ := json.MarshalIndent(mentorsDB{Mentors: []MentorProfile{}}, "", "  ")
		os.WriteFile(p, b, 0644)
	}
}

func readAll() mentorsDB {
	ensure()
	b, _ := os.ReadFile(dbPath())
	var m mentorsDB
	json.Unmarshal(b, &m)
	return m
}

func writeAll(m mentorsDB) {
	ensure()
	b, _ := json.MarshalIndent(m, "", "  ")
	os.WriteFile(dbPath(), b, 0644)
}

func ClearMentors() {
	mu.Lock()
	defer mu.Unlock()
	_ = ClearMentorsSQL()
}

func DeleteMentor(id string) bool {
	mu.Lock()
	defer mu.Unlock()
	ok, _ := DeleteMentorSQL(id)
	return ok
}

func SaveMentor(profile MentorProfile) string {
	mu.Lock()
	defer mu.Unlock()
	if strings.TrimSpace(profile.ID) == "" {
		profile.ID = generateID()
	}
	if strings.TrimSpace(profile.ExtractedAt) == "" {
		profile.ExtractedAt = time.Now().UTC().Format(time.RFC3339)
	}
	id, _ := SaveMentorSQL(profile)
	return id
}

func ListMentors() []map[string]any {
	mu.Lock()
	defer mu.Unlock()
	out, err := ListMentorsSQL()
	if err != nil {
		return []map[string]any{}
	}
	return out
}

func GetMentor(id string) map[string]any {
	mu.Lock()
	defer mu.Unlock()
	out, _ := GetMentorSQL(id)
	return out
}

func generateID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
