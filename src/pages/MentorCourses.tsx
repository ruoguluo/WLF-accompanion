import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import NavBar from '@/components/NavBar'
import { BookOpen, Clock, ListOrdered, Users, Target, ClipboardList, ChevronDown, ChevronUp, Pencil, Save, X, Plus, Minus } from 'lucide-react'
type Session = { title: string; goals: string[]; agenda: string[] }
type Course = { title: string; level: string; duration: string; description: string; sessionsCount: number; audience: string[]; generalGoals: string[]; sessions: Session[] }

export default function MentorCourses() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openCourses, setOpenCourses] = useState<Record<number, boolean>>({})
  const toggleCourse = (index: number) => setOpenCourses(prev => ({ ...prev, [index]: !prev[index] }))
  const [viewCourses, setViewCourses] = useState<Course[] | null>(null)
  const [draftCourses, setDraftCourses] = useState<Course[] | null>(null)
  const [editCourseIdx, setEditCourseIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    axios.get(`/api/mentors/${id}`)
      .then(res => { if (res.data?.success) setData(res.data.data) })
      .finally(() => setLoading(false))
  }, [id])

  const courses: Course[] = useMemo(() => {
    const list: string[] = []
    const skills: string[] = (data?.skills || []) as string[]
    const comps: string[] = (data?.topCompetences || []) as string[]
    const base = (comps.length ? comps : skills).filter((s: string) => (s || '').trim() !== '')
    for (const s of base.slice(0, 6)) { list.push(s) }
    if (list.length === 0) list.push('产品战略与定位', '技术架构选型', '融资与商业模式设计')
    const lv = ['初级', '中级', '高级']
    const audiencesByLevel: Record<string, string[]> = {
      '初级': ['初创团队', '新手产品经理', '转岗开发者'],
      '中级': ['增长团队', 'Tech Lead', '运营负责人'],
      '高级': ['CTO/VP', '资深架构师', '资深产品经理']
    }
    return list.map((t, i) => {
      const lvl = lv[i % lv.length]
      const sessionsCount = 4 + (i % 3)
      const generalGoals = [
        `理解「${t}」的核心概念与框架`,
        `能将「${t}」方法应用到实际业务场景`,
        `构建可复用的实践流程与度量指标`
      ]
      const sessions: Session[] = Array.from({ length: sessionsCount }).map((_, idx) => {
        const n = idx + 1
        const sTitle = `课时 ${n}: ${t} 实战 ${n}`
        const goals = [
          `掌握「${t}」在典型场景 ${n} 的应用`,
          `完成一次以「${t}」为核心的练习任务`
        ]
        const agenda = ['概念回顾', '案例分析', '实操演练', '答疑总结']
        return { title: sTitle, goals, agenda }
      })
      return {
        title: `专题：${t}`,
        level: lvl,
        duration: `${2 + (i % 3) * 2} 小时`,
        description: `围绕「${t}」的系统化课程，包含实践案例与答疑环节。`,
        sessionsCount,
        audience: audiencesByLevel[lvl],
        generalGoals,
        sessions
      }
    })
  }, [data])

  useEffect(() => {
    setViewCourses(courses)
    setDraftCourses(null)
    setEditCourseIdx(null)
  }, [courses])

  const startEdit = (idx: number) => {
    if (!viewCourses) return
    setDraftCourses(JSON.parse(JSON.stringify(viewCourses)))
    setEditCourseIdx(idx)
  }
  const saveEdit = () => {
    if (!draftCourses) return
    setViewCourses(draftCourses)
    setDraftCourses(null)
    setEditCourseIdx(null)
  }
  const cancelEdit = () => {
    setDraftCourses(null)
    setEditCourseIdx(null)
  }

  const updateSessionTitle = (cIdx: number, sIdx: number, val: string) => {
    if (!draftCourses) return
    const next = draftCourses.slice()
    next[cIdx].sessions[sIdx].title = val
    setDraftCourses(next)
  }
  const updateSessionGoal = (cIdx: number, sIdx: number, gIdx: number, val: string) => {
    if (!draftCourses) return
    const next = draftCourses.slice()
    next[cIdx].sessions[sIdx].goals[gIdx] = val
    setDraftCourses(next)
  }
  const addSessionGoal = (cIdx: number, sIdx: number) => {
    if (!draftCourses) return
    const next = draftCourses.slice()
    next[cIdx].sessions[sIdx].goals.push('')
    setDraftCourses(next)
  }
  const removeSessionGoal = (cIdx: number, sIdx: number, gIdx: number) => {
    if (!draftCourses) return
    const next = draftCourses.slice()
    next[cIdx].sessions[sIdx].goals = next[cIdx].sessions[sIdx].goals.filter((_, i) => i !== gIdx)
    setDraftCourses(next)
  }
  const updateSessionAgenda = (cIdx: number, sIdx: number, aIdx: number, val: string) => {
    if (!draftCourses) return
    const next = draftCourses.slice()
    next[cIdx].sessions[sIdx].agenda[aIdx] = val
    setDraftCourses(next)
  }
  const addSessionAgenda = (cIdx: number, sIdx: number) => {
    if (!draftCourses) return
    const next = draftCourses.slice()
    next[cIdx].sessions[sIdx].agenda.push('')
    setDraftCourses(next)
  }
  const removeSessionAgenda = (cIdx: number, sIdx: number, aIdx: number) => {
    if (!draftCourses) return
    const next = draftCourses.slice()
    next[cIdx].sessions[sIdx].agenda = next[cIdx].sessions[sIdx].agenda.filter((_, i) => i !== aIdx)
    setDraftCourses(next)
  }

  const updateCourseTitle = (cIdx: number, val: string) => {
    if (!draftCourses) return
    const next = draftCourses.slice()
    next[cIdx].title = val
    setDraftCourses(next)
  }
  const updateCourseLevel = (cIdx: number, val: string) => {
    if (!draftCourses) return
    const next = draftCourses.slice()
    next[cIdx].level = val
    setDraftCourses(next)
  }
  const updateCourseDuration = (cIdx: number, val: string) => {
    if (!draftCourses) return
    const next = draftCourses.slice()
    next[cIdx].duration = val
    setDraftCourses(next)
  }
  const updateSessionsCount = (cIdx: number, val: number) => {
    if (!draftCourses) return
    const n = Math.max(1, Math.min(12, val))
    const next = draftCourses.slice()
    const cur = next[cIdx]
    const diff = n - cur.sessions.length
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        const idx = cur.sessions.length + 1
        cur.sessions.push({ title: `课时 ${idx}: ${cur.title.replace('专题：','')} 实战 ${idx}`, goals: [''], agenda: [''] })
      }
    } else if (diff < 0) {
      cur.sessions = cur.sessions.slice(0, n)
    }
    cur.sessionsCount = n
    setDraftCourses(next)
  }
  const updateAudience = (cIdx: number, aIdx: number, val: string) => {
    if (!draftCourses) return
    const next = draftCourses.slice()
    next[cIdx].audience[aIdx] = val
    setDraftCourses(next)
  }
  const addAudience = (cIdx: number) => {
    if (!draftCourses) return
    const next = draftCourses.slice()
    next[cIdx].audience.push('')
    setDraftCourses(next)
  }
  const removeAudience = (cIdx: number, aIdx: number) => {
    if (!draftCourses) return
    const next = draftCourses.slice()
    next[cIdx].audience = next[cIdx].audience.filter((_, i) => i !== aIdx)
    setDraftCourses(next)
  }
  const updateGeneralGoal = (cIdx: number, gIdx: number, val: string) => {
    if (!draftCourses) return
    const next = draftCourses.slice()
    next[cIdx].generalGoals[gIdx] = val
    setDraftCourses(next)
  }
  const addGeneralGoal = (cIdx: number) => {
    if (!draftCourses) return
    const next = draftCourses.slice()
    next[cIdx].generalGoals.push('')
    setDraftCourses(next)
  }
  const removeGeneralGoal = (cIdx: number, gIdx: number) => {
    if (!draftCourses) return
    const next = draftCourses.slice()
    next[cIdx].generalGoals = next[cIdx].generalGoals.filter((_, i) => i !== gIdx)
    setDraftCourses(next)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">加载中...</div>
  if (!data) return <div className="min-h-screen flex items-center justify-center text-gray-600">未找到导师</div>

  const name = (data?.personalInfo?.name || '').trim() || '导师'

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar title="导师课程" />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link to="/mentor-card" className="text-indigo-600 hover:text-indigo-800 font-medium">返回导师名片列表</Link>
        </div>
        <div className="flex items-center space-x-2 mb-6">
          <Users className="w-5 h-5 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">{name} 的课程</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {(viewCourses || courses).map((c, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 shadow hover:shadow-lg transition-shadow">
              <div className="p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">{c.title}</span>
                </div>
                <div className="flex items-center justify-end">
                  {editCourseIdx === idx ? (
                    <div className="flex items-center space-x-3">
                      <button type="button" onClick={saveEdit} className="inline-flex items-center space-x-1 text-green-600 hover:text-green-800">
                        <Save className="w-4 h-4" />
                        <span>保存</span>
                      </button>
                      <button type="button" onClick={cancelEdit} className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-800">
                        <X className="w-4 h-4" />
                        <span>取消</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <button type="button" onClick={() => startEdit(idx)} className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800">
                        <Pencil className="w-4 h-4" />
                        <span>编辑</span>
                      </button>
                      <button type="button" onClick={() => toggleCourse(idx)} className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800">
                        <span>{openCourses[idx] ? '收起课时' : '展开课时'}</span>
                        {openCourses[idx] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
                {editCourseIdx === idx && draftCourses ? (
                  <div className="space-y-3">
                    <input className="border rounded px-3 py-2 text-sm w-full" value={draftCourses[idx].title} onChange={e => updateCourseTitle(idx, e.target.value)} placeholder="课程标题" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <ListOrdered className="w-4 h-4 text-gray-500" />
                        <span>难度：</span>
                        <select className="border rounded px-2 py-2 text-sm" value={draftCourses[idx].level} onChange={e => updateCourseLevel(idx, e.target.value)}>
                          <option value="初级">初级</option>
                          <option value="中级">中级</option>
                          <option value="高级">高级</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>时长：</span>
                        <input className="border rounded px-2 py-2 text-sm" value={draftCourses[idx].duration} onChange={e => updateCourseDuration(idx, e.target.value)} placeholder="如：4 小时" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 pt-2">
                      <div className="flex items-center space-x-2">
                        <ListOrdered className="w-4 h-4 text-gray-500" />
                        <span>课时数量：</span>
                        <input type="number" min={1} max={12} className="border rounded px-2 py-1 text-sm w-20" value={draftCourses[idx].sessionsCount} onChange={e => updateSessionsCount(idx, parseInt(e.target.value || '1', 10))} />
                      </div>
                      <div>
                        <div className="text-gray-700">试用人群：</div>
                        <div className="mt-1 space-y-2">
                          {(draftCourses[idx].audience || []).map((a, i2) => (
                            <div key={i2} className="flex items-center gap-2">
                              <input className="border rounded px-2 py-1 text-sm flex-1" value={a} onChange={e => updateAudience(idx, i2, e.target.value)} />
                              <button type="button" onClick={() => removeAudience(idx, i2)} className="text-red-600 hover:text-red-800"><Minus className="w-4 h-4" /></button>
                            </div>
                          ))}
                          <button type="button" onClick={() => addAudience(idx)} className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800"><Plus className="w-4 h-4" /><span>添加人群</span></button>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <Target className="w-4 h-4 text-gray-500" />
                        <span>课程目标：</span>
                        <button type="button" onClick={() => addGeneralGoal(idx)} className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800"><Plus className="w-4 h-4" /><span>添加目标</span></button>
                      </div>
                      <div className="mt-1 space-y-2">
                        {(draftCourses[idx].generalGoals || []).map((g, i3) => (
                          <div key={i3} className="flex items-center gap-2">
                            <input className="border rounded px-2 py-1 text-sm flex-1" value={g} onChange={e => updateGeneralGoal(idx, i3, e.target.value)} />
                            <button type="button" onClick={() => removeGeneralGoal(idx, i3)} className="text-red-600 hover:text-red-800"><Minus className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <ListOrdered className="w-4 h-4 text-gray-500" />
                      <span>难度：{c.level}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>时长：{c.duration}</span>
                    </div>
                    <div className="text-sm text-gray-700">{c.description}</div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 pt-2">
                  <div className="flex items-center space-x-2"><ListOrdered className="w-4 h-4 text-gray-500" /><span>课时数量：{c.sessionsCount}</span></div>
                  <div>
                    <div className="text-gray-700">试用人群：</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {c.audience.map((a, i2) => (
                        <span key={i2} className="inline-block bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded border border-indigo-200">{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span>课程目标：</span>
                  </div>
                  <ul className="mt-1 list-disc list-inside text-sm text-gray-700">
                    {c.generalGoals.map((g, i3) => (<li key={i3}>{g}</li>))}
                  </ul>
                </div>
                <div className="pt-2 space-y-3">
                  {openCourses[idx] && (
                    editCourseIdx === idx && draftCourses ? (
                      draftCourses[idx].sessions.map((s, si) => (
                        <div key={si} className="border border-gray-200 rounded p-3 space-y-2">
                          <input className="border rounded px-3 py-2 text-sm w-full" value={s.title} onChange={e => updateSessionTitle(idx, si, e.target.value)} placeholder="课时标题" />
                          <div className="flex items-center space-x-2 text-sm text-gray-700">
                            <Target className="w-4 h-4 text-gray-500" />
                            <span>该课时目标：</span>
                            <button type="button" onClick={() => addSessionGoal(idx, si)} className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800">
                              <Plus className="w-4 h-4" />
                              <span>添加目标</span>
                            </button>
                          </div>
                          {(s.goals || []).map((g, gi) => (
                            <div key={gi} className="flex items-center gap-2">
                              <input className="border rounded px-3 py-2 text-sm flex-1" value={g} onChange={e => updateSessionGoal(idx, si, gi, e.target.value)} placeholder={`目标 ${gi+1}`} />
                              <button type="button" onClick={() => removeSessionGoal(idx, si, gi)} className="text-red-600 hover:text-red-800">
                                <Minus className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <div className="flex items-center space-x-2 text-sm text-gray-700 mt-2">
                            <ClipboardList className="w-4 h-4 text-gray-500" />
                            <span>Agenda：</span>
                            <button type="button" onClick={() => addSessionAgenda(idx, si)} className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800">
                              <Plus className="w-4 h-4" />
                              <span>添加议程</span>
                            </button>
                          </div>
                          {(s.agenda || []).map((a, ai) => (
                            <div key={ai} className="flex items-center gap-2">
                              <input className="border rounded px-3 py-2 text-sm flex-1" value={a} onChange={e => updateSessionAgenda(idx, si, ai, e.target.value)} placeholder={`议程 ${ai+1}`} />
                              <button type="button" onClick={() => removeSessionAgenda(idx, si, ai)} className="text-red-600 hover:text-red-800">
                                <Minus className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ))
                    ) : (
                      c.sessions.map((s, si) => (
                        <div key={si} className="border border-gray-200 rounded p-3">
                          <div className="font-medium text-gray-900 mb-1">{s.title}</div>
                          <div className="flex items-center space-x-2 text-sm text-gray-700">
                            <Target className="w-4 h-4 text-gray-500" />
                            <span>该课时目标：</span>
                          </div>
                          <ul className="mt-1 list-disc list-inside text-sm text-gray-700">
                            {s.goals.map((g, gi) => (<li key={gi}>{g}</li>))}
                          </ul>
                          <div className="flex items-center space-x-2 text-sm text-gray-700 mt-2">
                            <ClipboardList className="w-4 h-4 text-gray-500" />
                            <span>Agenda：</span>
                          </div>
                          <ul className="mt-1 list-disc list-inside text-sm text-gray-700">
                            {s.agenda.map((a, ai) => (<li key={ai}>{a}</li>))}
                          </ul>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
