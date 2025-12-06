package store

import (
    "database/sql"
    "encoding/json"
    "os"
    "path/filepath"
    "strings"
    _ "modernc.org/sqlite"
)

func dbMentorsPath() string {
    return filepath.Join("api", "data", "mentors.db")
}

func ensureMentorsSQL() (*sql.DB, error) {
    p := dbMentorsPath()
    os.MkdirAll(filepath.Dir(p), 0755)
    db, err := sql.Open("sqlite", p)
    if err != nil { return nil, err }
    _, err = db.Exec(`CREATE TABLE IF NOT EXISTS mentors (
        id TEXT PRIMARY KEY,
        name TEXT,
        extracted_at TEXT,
        json TEXT
    );`)
    if err != nil { db.Close(); return nil, err }
    return db, nil
}

func SaveMentorSQL(profile MentorProfile) (string, error) {
    db, err := ensureMentorsSQL(); if err != nil { return "", err }
    defer db.Close()
    if strings.TrimSpace(profile.ID) == "" { profile.ID = generateID() }
    b, _ := json.Marshal(profile)
    name := strings.TrimSpace(profile.PersonalInfo.Name)
    if name == "" { name = "Unknown" }
    _, err = db.Exec(`INSERT INTO mentors (id, name, extracted_at, json) VALUES (?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, extracted_at=excluded.extracted_at, json=excluded.json`,
        profile.ID, name, profile.ExtractedAt, string(b))
    if err != nil { return "", err }
    return profile.ID, nil
}

func ListMentorsSQL() ([]map[string]any, error) {
    db, err := ensureMentorsSQL(); if err != nil { return nil, err }
    defer db.Close()
    rows, err := db.Query(`SELECT id, name, extracted_at, json FROM mentors ORDER BY extracted_at DESC`)
    if err != nil { return nil, err }
    defer rows.Close()
    out := []map[string]any{}
    for rows.Next() {
        var id, name, extracted, js string
        if err := rows.Scan(&id, &name, &extracted, &js); err != nil { continue }
        certStr := "None"
        expertise := []string{}
        if js != "" {
            var mp MentorProfile
            _ = json.Unmarshal([]byte(js), &mp)
            if len(mp.Certificates) > 0 { certStr = strings.Join(mp.Certificates, ", ") }
            if len(mp.TopCompetences) > 0 {
                for _, c := range mp.TopCompetences { if strings.TrimSpace(c) != "" { expertise = append(expertise, c) } }
            } else if len(mp.Skills) > 0 {
                for _, s := range mp.Skills { if strings.TrimSpace(s) != "" { expertise = append(expertise, s) } }
            }
        }
        if len(expertise) == 0 {
            expertise = []string{"产品战略与定位", "技术架构选型与落地", "融资与商业模式设计"}
        }
        if len(expertise) > 5 { expertise = expertise[:5] }
        out = append(out, map[string]any{"id": id, "name": name, "createdAt": extracted, "certificates": certStr, "expertise": expertise})
    }
    return out, nil
}

func GetMentorSQL(id string) (map[string]any, error) {
    db, err := ensureMentorsSQL(); if err != nil { return nil, err }
    defer db.Close()
    row := db.QueryRow(`SELECT json FROM mentors WHERE id = ?`, id)
    var js string
    if err := row.Scan(&js); err != nil {
        if err == sql.ErrNoRows { return nil, nil }
        return nil, err
    }
    var out map[string]any
    _ = json.Unmarshal([]byte(js), &out)
    return out, nil
}

func DeleteMentorSQL(id string) (bool, error) {
    db, err := ensureMentorsSQL(); if err != nil { return false, err }
    defer db.Close()
    res, err := db.Exec(`DELETE FROM mentors WHERE id = ?`, id)
    if err != nil { return false, err }
    n, _ := res.RowsAffected()
    return n > 0, nil
}

func ClearMentorsSQL() error {
    db, err := ensureMentorsSQL(); if err != nil { return err }
    defer db.Close()
    _, err = db.Exec(`DELETE FROM mentors`)
    return err
}

func MigrateMentorsToSQLite() {
    db, err := ensureMentorsSQL(); if err != nil { return }
    defer db.Close()
    var cnt int
    _ = db.QueryRow(`SELECT COUNT(1) FROM mentors`).Scan(&cnt)
    if cnt > 0 { return }
    m := readAll()
    for _, p := range m.Mentors {
        _, _ = SaveMentorSQL(p)
    }
}
