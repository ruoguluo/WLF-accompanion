import express from 'express'
import { createMentor, listMentors, getMentor, type MentorProfile } from '../services/mentorStore.js'

const router = express.Router()

router.get('/mentors', async (_req, res) => {
  try {
    const items = listMentors()
    res.json({ success: true, data: items })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.get('/mentors/:id', async (req, res) => {
  try {
    const id = req.params.id
    const item = getMentor(id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: item })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.post('/mentors', async (req, res) => {
  try {
    const body = req.body as Omit<MentorProfile, 'id'>
    if (!body?.personalInfo?.name) return res.status(400).json({ success: false, error: 'Invalid payload' })
    const { id } = createMentor(body)
    res.json({ success: true, data: { id } })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

export default router