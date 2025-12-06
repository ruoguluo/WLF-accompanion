import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export interface MentorProfile {
  id: string
  personalInfo: {
    name: string
    email?: string
    phone?: string
    location?: string
    linkedin?: string
  }
  education: Array<{
    institution: string
    degree: string
    field: string
    startDate: string
    endDate: string
    gpa?: string
  }>
  experience: Array<{
    company: string
    position: string
    startDate: string
    endDate: string
    description: string
    location?: string
  }>
  skills: string[]
  summary?: string
  extractedAt: string
  source: 'resume' | 'linkedin'
  topCompetences?: string[]
  topAchievements?: string[]
}

type MentorDB = {
  mentors: MentorProfile[]
}

const dataDir = path.join(process.cwd(), 'api', 'data')
const dbPath = path.join(dataDir, 'mentors.json')

function ensureDB(): void {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ mentors: [] }, null, 2))
  }
}

function readDB(): MentorDB {
  ensureDB()
  const raw = fs.readFileSync(dbPath, 'utf-8')
  return JSON.parse(raw)
}

function writeDB(db: MentorDB): void {
  ensureDB()
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
}

export function createMentor(profile: Omit<MentorProfile, 'id'>): { id: string } {
  const db = readDB()
  const id = randomUUID()
  const record: MentorProfile = { id, ...profile }
  db.mentors.push(record)
  writeDB(db)
  return { id }
}

export function listMentors(): Array<{ id: string; name: string; createdAt: string }> {
  const db = readDB()
  return db.mentors.map(m => ({ id: m.id, name: m.personalInfo?.name || 'Unknown', createdAt: m.extractedAt }))
}

export function getMentor(id: string): MentorProfile | null {
  const db = readDB()
  const found = db.mentors.find(m => m.id === id)
  return found ?? null
}