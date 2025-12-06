package server

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"wlfaccompanion/internal/llm"
	"wlfaccompanion/internal/store"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
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

type ExtractedProfile struct {
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
}

func Router() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
			if req.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, req)
		})
	})

	store.MigrateMentorsToSQLite()
	r.Get("/api/health", func(w http.ResponseWriter, req *http.Request) {
		json.NewEncoder(w).Encode(map[string]any{"success": true, "message": "ok"})
	})

	r.Post("/api/upload-resume", func(w http.ResponseWriter, req *http.Request) {
		if err := req.ParseMultipartForm(20 << 20); err != nil {
			writeErr(w, http.StatusBadRequest, "NO_FILE_UPLOADED", "No file was uploaded")
			return
		}
		f, hdr, err := req.FormFile("resume")
		if err != nil {
			writeErr(w, http.StatusBadRequest, "NO_FILE_UPLOADED", "No file was uploaded")
			return
		}
		defer f.Close()
		ext := strings.ToLower(filepath.Ext(hdr.Filename))
		body, err := io.ReadAll(f)
		if err != nil {
			writeErr(w, http.StatusInternalServerError, "TEXT_EXTRACTION_FAILED", "Failed to read text")
			return
		}
		text, err := ExtractText(ext, body)
		if err != nil {
			msg := err.Error()
			code := "INVALID_FILE_FORMAT"
			if strings.Contains(msg, "unsupported file type") {
				msg = "Unsupported file type. Supported: .txt, .docx, .pdf"
				code = "UNSUPPORTED_FILE_TYPE"
			} else if strings.Contains(msg, "pdftotext not found") {
				code = "PDF_TOOL_MISSING"
			}
			writeErr(w, http.StatusBadRequest, code, msg)
			return
		}

		llmClient := llm.NewClient(os.Getenv("OPENROUTER_API_KEY"), os.Getenv("OPENROUTER_MODEL"))
		prof, err := llmClient.ExtractInfo(text, "resume")
		if err != nil {
			writeErr(w, http.StatusInternalServerError, "INFORMATION_EXTRACTION_FAILED", "Failed to extract information")
			return
		}
		if strings.TrimSpace(prof.PersonalInfo.Name) == "" {
			ln := prof.PersonalInfo.Linkedin
			if ln == "" {
				ln = findLinkedin(text)
			}
			if n := guessNameFromLinkedin(ln); n != "" {
				prof.PersonalInfo.Name = n
			} else if n := guessNameFromEmail(prof.PersonalInfo.Email); n != "" {
				prof.PersonalInfo.Name = n
			} else if em := findEmail(text); em != "" {
				if n := guessNameFromEmail(em); n != "" {
					prof.PersonalInfo.Name = n
				}
			} else if n := guessName(text); n != "" {
				prof.PersonalInfo.Name = n
			}
		}

		id := store.SaveMentor(store.MentorProfile{
			PersonalInfo: store.PersonalInfo{
				Name:     prof.PersonalInfo.Name,
				Email:    prof.PersonalInfo.Email,
				Phone:    prof.PersonalInfo.Phone,
				Location: prof.PersonalInfo.Location,
				Linkedin: prof.PersonalInfo.Linkedin,
			},
			Education:          toEdu(prof.Education),
			Experience:         toExp(prof.Experience),
			Skills:             prof.Skills,
			Summary:            prof.Summary,
			ExtractedAt:        prof.ExtractedAt,
			Source:             prof.Source,
			TopCompetences:     prof.TopCompetences,
			TopAchievements:    prof.TopAchievements,
			StudyWorkAlignment: prof.StudyWorkAlignment,
		})

		json.NewEncoder(w).Encode(map[string]any{"success": true, "data": map[string]any{"id": id, "personalInfo": prof.PersonalInfo, "education": prof.Education, "experience": prof.Experience, "skills": prof.Skills, "summary": prof.Summary, "extractedAt": prof.ExtractedAt, "source": prof.Source, "topCompetences": prof.TopCompetences, "topAchievements": prof.TopAchievements, "studyWorkAlignment": prof.StudyWorkAlignment, "industry": prof.Industry, "experienceDuration": prof.ExperienceDuration}})
	})

	r.Get("/api/mentors", func(w http.ResponseWriter, req *http.Request) {
		items := store.ListMentors()
		json.NewEncoder(w).Encode(map[string]any{"success": true, "data": items})
	})
	r.Delete("/api/mentors", func(w http.ResponseWriter, req *http.Request) {
		store.ClearMentors()
		json.NewEncoder(w).Encode(map[string]any{"success": true})
	})
	r.Delete("/api/mentors/{id}", func(w http.ResponseWriter, req *http.Request) {
		id := chi.URLParam(req, "id")
		if id == "" {
			writeErr(w, http.StatusBadRequest, "INVALID_ID", "Invalid id")
			return
		}
		ok := store.DeleteMentor(id)
		if !ok {
			writeErr(w, http.StatusNotFound, "NOT_FOUND", "Not found")
			return
		}
		json.NewEncoder(w).Encode(map[string]any{"success": true})
	})
	r.Get("/api/mentors/{id}", func(w http.ResponseWriter, req *http.Request) {
		id := chi.URLParam(req, "id")
		m := store.GetMentor(id)
		if m == nil {
			writeJSON(w, http.StatusNotFound, map[string]any{"success": false, "error": "Not found"})
			return
		}
		json.NewEncoder(w).Encode(map[string]any{"success": true, "data": m})
	})

	// Entrepreneurship details persisted in SQLite
	r.Get("/api/mentors/{id}/entrepreneurship", func(w http.ResponseWriter, req *http.Request) {
		id := chi.URLParam(req, "id")
		if id == "" {
			writeErr(w, http.StatusBadRequest, "INVALID_ID", "Invalid id")
			return
		}
		e, err := store.GetEntrepreneurship(id)
		if err != nil {
			writeErr(w, http.StatusInternalServerError, "SQL_ERROR", err.Error())
			return
		}
		if e == nil {
			writeJSON(w, http.StatusOK, map[string]any{"success": true, "data": nil})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"success": true, "data": e})
	})
	r.Post("/api/mentors/{id}/entrepreneurship", func(w http.ResponseWriter, req *http.Request) {
		id := chi.URLParam(req, "id")
		if id == "" {
			writeErr(w, http.StatusBadRequest, "INVALID_ID", "Invalid id")
			return
		}
		var in struct {
			CompanyName   string            `json:"companyName"`
			BrandName     string            `json:"brandName"`
			Market        string            `json:"market"`
			Industry      string            `json:"industry"`
			StaffSize     string            `json:"staffSize"`
			BusinessScale string            `json:"businessScale"`
			FundingScale  string            `json:"fundingScale"`
			Stage         string            `json:"stage"`
			JourneyStart  string            `json:"journeyStart"`
			Milestones    []store.Milestone `json:"milestones"`
		}
		if err := json.NewDecoder(req.Body).Decode(&in); err != nil {
			writeErr(w, http.StatusBadRequest, "INVALID_JSON", "Invalid JSON body")
			return
		}
		e := store.Entrepreneurship{
			CompanyName:   in.CompanyName,
			BrandName:     in.BrandName,
			Market:        in.Market,
			Industry:      in.Industry,
			StaffSize:     in.StaffSize,
			BusinessScale: in.BusinessScale,
			FundingScale:  in.FundingScale,
			Stage:         in.Stage,
			JourneyStart:  in.JourneyStart,
			Milestones:    in.Milestones,
		}
		if err := store.UpsertEntrepreneurship(id, e); err != nil {
			writeErr(w, http.StatusInternalServerError, "SQL_ERROR", err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"success": true, "data": e})
	})

	return r
}

func writeErr(w http.ResponseWriter, status int, code, msg string) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]any{"success": false, "error": map[string]any{"code": code, "message": msg}})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

var nameRegexps = []*regexp.Regexp{
	regexp.MustCompile(`^[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?$`),
	regexp.MustCompile(`^[A-Z][a-z]+\s+[A-Z]\.\s*[A-Z][a-z]+$`),
	regexp.MustCompile(`^[A-Z]{2,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?$`),
	regexp.MustCompile(`^[A-Z][a-z]+\s+\([A-Za-z]{2,}\)\s+[A-Z][a-z]+$`),
}

var headingDeny = []string{
	"summary", "professional summary", "experience", "work experience",
	"education", "skills", "relevant skills", "projects", "certifications",
	"profile", "objective", "achievements",
}

func guessName(text string) string {
	lines := strings.Split(text, "\n")
lineLoop:
	for i, line := range lines {
		if i > 25 {
			break
		}
		s := strings.TrimSpace(line)
		if s == "" || len(s) > 60 {
			continue
		}
		if !regexp.MustCompile(`^[A-Za-z\s\.'-@|:]+$`).MatchString(s) {
			continue
		}
		ls := strings.ToLower(s)
		for _, h := range headingDeny {
			if strings.Contains(ls, h) {
				continue lineLoop
			}
		}
		// Prefer leading two-word name at line start (prefix match)
		toks := strings.Fields(s)
		if len(toks) >= 2 {
			w1, w2 := toks[0], toks[1]
			if regexp.MustCompile(`^[A-Za-z\.'-]+$`).MatchString(w1) && regexp.MustCompile(`^[A-Za-z\.'-]+$`).MatchString(w2) {
				// TitleCase or ALLCAPS
				if (regexp.MustCompile(`^[A-Z][a-z]+$`).MatchString(w1) && regexp.MustCompile(`^[A-Z][a-z]+$`).MatchString(w2)) ||
					(regexp.MustCompile(`^[A-Z]{2,}$`).MatchString(w1) && regexp.MustCompile(`^[A-Z]{2,}$`).MatchString(w2)) {
					wl := strings.ToLower(w1 + " " + w2)
					blocked := false
					for _, h := range headingDeny {
						if strings.Contains(wl, h) {
							blocked = true
							break
						}
					}
					if !blocked {
						return toTitle([]string{w1, w2})
					}
				}
			}
		}
		// Regex prefix fallback: First Last at line start
		if m := regexp.MustCompile(`^[A-Z][a-z]+(?:\s+\([A-Za-z]{1,}\))?\s+[A-Z][a-z]+`).FindString(s); m != "" {
			raw := strings.Fields(m)
			parts := make([]string, 0, len(raw))
			for _, t := range raw {
				if !regexp.MustCompile(`^\([A-Za-z]{1,}\)$`).MatchString(t) {
					parts = append(parts, t)
				}
			}
			if len(parts) >= 2 {
				return toTitle(parts[:2])
			}
		}
		if m := regexp.MustCompile(`^[A-Z]{2,}\s+[A-Z]{2,}`).FindString(s); m != "" {
			parts := strings.Fields(strings.ToLower(m))
			if len(parts) >= 2 {
				return toTitle(parts[:2])
			}
		}
		// After trying leading tokens, now skip noisy lines
		if strings.Contains(s, "@") {
			continue
		}
		if regexp.MustCompile(`\d`).MatchString(s) {
			continue
		}
		if !regexp.MustCompile(`^[A-Za-z\s\.'-]+$`).MatchString(s) {
			continue
		}
		for _, re := range nameRegexps {
			if re.MatchString(s) {
				// If all caps, normalize to title case
				if regexp.MustCompile(`^[A-Z\s\.'-]+$`).MatchString(s) {
					return toTitle(strings.Fields(strings.ToLower(s)))
				}
				return s
			}
		}
		// Heuristic: 2-4 words, all alphabetic → treat as name
		words := strings.Fields(s)
		if len(words) >= 2 && len(words) <= 4 {
			allAlpha := true
			for _, w := range words {
				if !regexp.MustCompile(`^[A-Za-z\.'-]+$`).MatchString(w) {
					allAlpha = false
					break
				}
			}
			if allAlpha {
				// Avoid picking obvious headings like "Relevant Skills"
				wl := strings.ToLower(strings.Join(words, " "))
				for _, h := range headingDeny {
					if strings.Contains(wl, h) {
						continue lineLoop
					}
				}
				return toTitle(words)
			}
		}
	}
	return ""
}

func guessNameFromEmail(email string) string {
	email = strings.TrimSpace(email)
	if email == "" {
		return ""
	}
	at := strings.IndexByte(email, '@')
	if at <= 0 {
		return ""
	}
	local := email[:at]
	local = strings.ReplaceAll(local, ".", " ")
	local = strings.ReplaceAll(local, "_", " ")
	local = strings.ReplaceAll(local, "-", " ")
	parts := strings.Fields(local)
	if len(parts) < 2 {
		return ""
	}
	return toTitle(parts)
}

func guessNameFromLinkedin(link string) string {
	link = strings.TrimSpace(link)
	if link == "" {
		return ""
	}
	u, err := url.Parse(link)
	if err != nil {
		return ""
	}
	p := strings.Trim(u.Path, "/")
	segs := strings.Split(p, "/")
	last := segs[len(segs)-1]
	if last == "" {
		return ""
	}
	last = strings.ReplaceAll(last, "-", " ")
	last = strings.ReplaceAll(last, "_", " ")
	raw := strings.Fields(last)
	parts := make([]string, 0, len(raw))
	for _, t := range raw {
		if regexp.MustCompile(`^[A-Za-z]+$`).MatchString(t) {
			parts = append(parts, t)
		}
	}
	if len(parts) < 2 {
		return ""
	}
	return toTitle(parts[:2])
}

func toTitle(parts []string) string {
	for i := range parts {
		s := strings.ToLower(parts[i])
		if s == "" {
			continue
		}
		r := []rune(s)
		r[0] = []rune(strings.ToUpper(string(r[0])))[0]
		parts[i] = string(r)
	}
	return strings.Join(parts, " ")
}

func findEmail(text string) string {
	re := regexp.MustCompile(`(?i)email\s*[:]?\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})`)
	if m := re.FindStringSubmatch(text); len(m) == 2 {
		return m[1]
	}
	re2 := regexp.MustCompile(`([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})`)
	if m := re2.FindStringSubmatch(text); len(m) == 2 {
		return m[1]
	}
	return ""
}

func findLinkedin(text string) string {
	re := regexp.MustCompile(`https?://[A-Za-z0-9./-]*linkedin\.com/in/[A-Za-z0-9-_/]+`)
	return re.FindString(text)
}

func toEdu(in []llm.Education) []store.Education {
	out := make([]store.Education, 0, len(in))
	for _, e := range in {
		out = append(out, store.Education{
			Institution: e.Institution,
			Degree:      e.Degree,
			Field:       e.Field,
			StartDate:   e.StartDate,
			EndDate:     e.EndDate,
			GPA:         e.GPA,
		})
	}
	return out
}

func toExp(in []llm.Experience) []store.Experience {
	out := make([]store.Experience, 0, len(in))
	for _, e := range in {
		out = append(out, store.Experience{
			Company:     e.Company,
			Position:    e.Position,
			StartDate:   e.StartDate,
			EndDate:     e.EndDate,
			Description: e.Description,
			Location:    e.Location,
		})
	}
	return out
}
