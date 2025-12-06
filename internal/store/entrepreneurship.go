package store

import (
    "database/sql"
    "encoding/json"
    "os"
    "path/filepath"
    _ "modernc.org/sqlite"
)

type Milestone struct {
    Date   string `json:"date"`
    Title  string `json:"title"`
    Detail string `json:"detail,omitempty"`
}

type Entrepreneurship struct {
    CompanyName   string     `json:"companyName"`
    BrandName     string     `json:"brandName"`
    Market        string     `json:"market"`
    Industry      string     `json:"industry"`
    StaffSize     string     `json:"staffSize"`
    BusinessScale string     `json:"businessScale"`
    FundingScale  string     `json:"fundingScale"`
    Stage         string     `json:"stage"`
    JourneyStart  string     `json:"journeyStart"`
    Milestones    []Milestone `json:"milestones"`
}

func dbSQLPath() string {
    return filepath.Join("api", "data", "mentors.db")
}

func ensureSQL() (*sql.DB, error) {
    p := dbSQLPath()
    os.MkdirAll(filepath.Dir(p), 0755)
    db, err := sql.Open("sqlite", p)
    if err != nil { return nil, err }
    _, err = db.Exec(`CREATE TABLE IF NOT EXISTS entrepreneurship (
        mentor_id TEXT PRIMARY KEY,
        company_name TEXT,
        brand_name TEXT,
        market TEXT,
        industry TEXT,
        staff_size TEXT,
        business_scale TEXT,
        funding_scale TEXT,
        stage TEXT,
        journey_start TEXT,
        milestones_json TEXT
    );`)
    if err != nil { db.Close(); return nil, err }
    return db, nil
}

func GetEntrepreneurship(mentorID string) (*Entrepreneurship, error) {
    db, err := ensureSQL(); if err != nil { return nil, err }
    defer db.Close()
    row := db.QueryRow(`SELECT company_name, brand_name, market, industry, staff_size, business_scale, funding_scale, stage, journey_start, milestones_json FROM entrepreneurship WHERE mentor_id = ?`, mentorID)
    var e Entrepreneurship
    var msJSON string
    err = row.Scan(&e.CompanyName, &e.BrandName, &e.Market, &e.Industry, &e.StaffSize, &e.BusinessScale, &e.FundingScale, &e.Stage, &e.JourneyStart, &msJSON)
    if err == sql.ErrNoRows { return nil, nil }
    if err != nil { return nil, err }
    if msJSON != "" { _ = json.Unmarshal([]byte(msJSON), &e.Milestones) }
    return &e, nil
}

func UpsertEntrepreneurship(mentorID string, e Entrepreneurship) error {
    db, err := ensureSQL(); if err != nil { return err }
    defer db.Close()
    b, _ := json.Marshal(e.Milestones)
    _, err = db.Exec(`INSERT INTO entrepreneurship (
        mentor_id, company_name, brand_name, market, industry, staff_size, business_scale, funding_scale, stage, journey_start, milestones_json
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(mentor_id) DO UPDATE SET
        company_name=excluded.company_name,
        brand_name=excluded.brand_name,
        market=excluded.market,
        industry=excluded.industry,
        staff_size=excluded.staff_size,
        business_scale=excluded.business_scale,
        funding_scale=excluded.funding_scale,
        stage=excluded.stage,
        journey_start=excluded.journey_start,
        milestones_json=excluded.milestones_json`,
        mentorID, e.CompanyName, e.BrandName, e.Market, e.Industry, e.StaffSize, e.BusinessScale, e.FundingScale, e.Stage, e.JourneyStart, string(b))
    return err
}

