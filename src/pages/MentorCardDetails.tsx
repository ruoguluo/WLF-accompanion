import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import NavBar from '@/components/NavBar'
import { Building2, Trophy, MapPin, Users, Briefcase, DollarSign, Layers, Calendar, ChevronDown, ChevronUp, Pencil, Save, Plus, X } from 'lucide-react'

type Milestone = { date: string; title: string; detail?: string }
type Journey = { start: string; milestones: Milestone[] }
type Entrepreneurship = {
  companyName: string
  brandName: string
  market: string
  industry: string
  staffSize: string
  businessScale: string
  fundingScale: string
  stage: string
  journey: Journey
}

export default function MentorCardDetails() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(true)
  const [edit, setEdit] = useState(false)
  const [draft, setDraft] = useState<Entrepreneurship | null>(null)
  const [viewEnt, setViewEnt] = useState<Entrepreneurship | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    axios.get(`/api/mentors/${id}`)
      .then(res => { if (res.data?.success) setData(res.data.data) })
      .finally(() => setLoading(false))
  }, [id])

  const ent: Entrepreneurship | null = useMemo(() => {
    if (!data) return null
    const name = (data?.personalInfo?.name || '').trim()
    const base = name || 'Mentor'
    const industry = (data?.industry || '').trim() || '科技'
    const start = (data?.extractedAt || '').slice(0, 7) || '2021-01'
    return {
      companyName: `${base} 创新科技`,
      brandName: `${base} Labs`,
      market: '中国大陆 / 企业服务',
      industry,
      staffSize: '50-150 人',
      businessScale: '年营收 3000-8000 万人民币',
      fundingScale: 'A-B 轮，累计融资 3000-10000 万人民币',
      stage: '扩张期 / 产品矩阵成型',
      journey: {
        start,
        milestones: [
          { date: start, title: '公司成立', detail: '完成核心团队搭建与方向确定' },
          { date: addMonths(start, 6), title: '首版产品发布', detail: '产品进入首批客户试点' },
          { date: addMonths(start, 12), title: 'A 轮融资', detail: '加速研发与市场拓展' },
          { date: addMonths(start, 18), title: '进入头部客户', detail: '签约多家大型企业项目' },
        ]
      }
    }
  }, [data])

  useEffect(() => {
    if (ent) {
      setViewEnt(ent)
      setDraft(ent)
      if (id) {
        axios.get(`/api/mentors/${id}/entrepreneurship`).then(res => {
          if (res.data?.success && res.data.data) {
            const e = res.data.data as any
            const loaded = {
              companyName: e.companyName,
              brandName: e.brandName,
              market: e.market,
              industry: e.industry,
              staffSize: e.staffSize,
              businessScale: e.businessScale,
              fundingScale: e.fundingScale,
              stage: e.stage,
              journey: { start: e.journeyStart, milestones: e.milestones || [] }
            }
            setViewEnt(loaded)
            setDraft(loaded)
          }
        }).catch(() => {})
      }
    }
  }, [ent])

  const onChange = (key: keyof Entrepreneurship, value: string) => {
    if (!draft) return
    setDraft({ ...draft, [key]: value })
  }

  const onJourneyStartChange = (value: string) => {
    if (!draft) return
    setDraft({ ...draft, journey: { ...draft.journey, start: value } })
  }

  const addMilestone = () => {
    if (!draft) return
    const ms = draft.journey.milestones.slice()
    ms.push({ date: draft.journey.start, title: '新里程碑', detail: '补充描述' })
    setDraft({ ...draft, journey: { ...draft.journey, milestones: ms } })
  }

  const updateMilestone = (idx: number, field: keyof Milestone, value: string) => {
    if (!draft) return
    const ms = draft.journey.milestones.map((m, i) => i === idx ? { ...m, [field]: value } : m)
    setDraft({ ...draft, journey: { ...draft.journey, milestones: ms } })
  }

  const removeMilestone = (idx: number) => {
    if (!draft) return
    const ms = draft.journey.milestones.filter((_, i) => i !== idx)
    setDraft({ ...draft, journey: { ...draft.journey, milestones: ms } })
  }

  const save = () => {
    if (!draft) return
    if (!id) { setViewEnt(draft); setEdit(false); return }
    const payload = {
      companyName: draft.companyName,
      brandName: draft.brandName,
      market: draft.market,
      industry: draft.industry,
      staffSize: draft.staffSize,
      businessScale: draft.businessScale,
      fundingScale: draft.fundingScale,
      stage: draft.stage,
      journeyStart: draft.journey.start,
      milestones: draft.journey.milestones
    }
    axios.post(`/api/mentors/${id}/entrepreneurship`, payload)
      .then(res => {
        if (res.data?.success && res.data.data) {
          const e = res.data.data
          const saved = {
            companyName: e.companyName,
            brandName: e.brandName,
            market: e.market,
            industry: e.industry,
            staffSize: e.staffSize,
            businessScale: e.businessScale,
            fundingScale: e.fundingScale,
            stage: e.stage,
            journey: { start: e.journeyStart, milestones: e.milestones || [] }
          }
          setViewEnt(saved)
          setDraft(saved)
        } else {
          setViewEnt(draft)
        }
      })
      .finally(() => setEdit(false))
  }

  const cancel = () => {
    if (viewEnt) setDraft(viewEnt)
    setEdit(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">加载中...</div>
  if (!data || !ent) return <div className="min-h-screen flex items-center justify-center text-gray-600">未找到导师</div>
  const current = (viewEnt || ent)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <NavBar title="导师名片详情" />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link to="/mentor-card" className="text-indigo-600 hover:text-indigo-800 font-medium">返回导师名片列表</Link>
        </div>
        <div className="flex items-center space-x-2 mb-6">
          <Trophy className="w-5 h-5 text-amber-600" />
          <h1 className="text-2xl font-bold text-gray-900">创业成功经历</h1>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">{current.companyName}</span>
              </div>
              <div className="text-sm text-gray-600">品牌：{current.brandName}</div>
              <div className="text-sm text-gray-600">市场：{current.market}</div>
              <div className="text-sm text-gray-600">行业：{current.industry}</div>
            </div>
            <div className="flex items-center space-x-3">
              {!edit ? (
                <button type="button" onClick={() => setEdit(true)} className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800">
                  <Pencil className="w-4 h-4" />
                  <span>编辑</span>
                </button>
              ) : (
                <>
                  <button type="button" onClick={save} className="inline-flex items-center space-x-1 text-green-600 hover:text-green-800">
                    <Save className="w-4 h-4" />
                    <span>保存</span>
                  </button>
                  <button type="button" onClick={cancel} className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-800">
                    <X className="w-4 h-4" />
                    <span>取消</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
              >
                <span>{open ? '收起详情' : '查看详情'}</span>
                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {open && (
            <div className="px-4 pb-4">
              {!edit ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2"><MapPin className="w-4 h-4 text-gray-500" /><span>市场：{current.market}</span></div>
                  <div className="flex items-center space-x-2"><Layers className="w-4 h-4 text-gray-500" /><span>行业：{current.industry}</span></div>
                  <div className="flex items-center space-x-2"><Users className="w-4 h-4 text-gray-500" /><span>人员规模：{current.staffSize}</span></div>
                  <div className="flex items-center space-x-2"><Briefcase className="w-4 h-4 text-gray-500" /><span>业务规模：{current.businessScale}</span></div>
                  <div className="flex items-center space-x-2"><DollarSign className="w-4 h-4 text-gray-500" /><span>融资规模：{current.fundingScale}</span></div>
                  <div className="flex items-center space-x-2"><Layers className="w-4 h-4 text-gray-500" /><span>业务阶段：{current.stage}</span></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className="border rounded px-3 py-2 text-sm" value={draft?.companyName || ''} onChange={e => onChange('companyName', e.target.value)} placeholder="公司名字" />
                    <input className="border rounded px-3 py-2 text-sm" value={draft?.brandName || ''} onChange={e => onChange('brandName', e.target.value)} placeholder="品牌名字" />
                    <input className="border rounded px-3 py-2 text-sm" value={draft?.market || ''} onChange={e => onChange('market', e.target.value)} placeholder="所在市场" />
                    <input className="border rounded px-3 py-2 text-sm" value={draft?.industry || ''} onChange={e => onChange('industry', e.target.value)} placeholder="行业" />
                    <input className="border rounded px-3 py-2 text-sm" value={draft?.staffSize || ''} onChange={e => onChange('staffSize', e.target.value)} placeholder="人员规模" />
                    <input className="border rounded px-3 py-2 text-sm" value={draft?.businessScale || ''} onChange={e => onChange('businessScale', e.target.value)} placeholder="业务规模" />
                    <input className="border rounded px-3 py-2 text-sm" value={draft?.fundingScale || ''} onChange={e => onChange('fundingScale', e.target.value)} placeholder="融资规模" />
                    <input className="border rounded px-3 py-2 text-sm" value={draft?.stage || ''} onChange={e => onChange('stage', e.target.value)} placeholder="业务阶段" />
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-900 font-semibold">创业历程</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                      <input className="border rounded px-3 py-2 text-sm" value={draft?.journey.start || ''} onChange={e => onJourneyStartChange(e.target.value)} placeholder="开始时间 (YYYY-MM)" />
                      <button type="button" onClick={addMilestone} className="inline-flex items-center justify-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-2 rounded">
                        <Plus className="w-4 h-4" />
                        <span>添加里程碑</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(draft?.journey.milestones || []).map((m, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                          <input className="md:col-span-2 border rounded px-2 py-2 text-sm" value={m.date} onChange={e => updateMilestone(idx, 'date', e.target.value)} placeholder="日期 (YYYY-MM)" />
                          <input className="md:col-span-3 border rounded px-2 py-2 text-sm" value={m.title} onChange={e => updateMilestone(idx, 'title', e.target.value)} placeholder="标题" />
                          <input className="md:col-span-6 border rounded px-2 py-2 text-sm" value={m.detail || ''} onChange={e => updateMilestone(idx, 'detail', e.target.value)} placeholder="描述" />
                          <button type="button" onClick={() => removeMilestone(idx)} className="md:col-span-1 text-red-600 hover:text-red-800 text-sm">删除</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {!edit && (
                <div className="mt-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-900 font-semibold">创业历程</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">开始时间：{current.journey.start}</div>
                  <div className="space-y-3">
                    {current.journey.milestones.map((m, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <div className="w-20 text-xs text-gray-500">{m.date}</div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{m.title}</div>
                          {m.detail && <div className="text-sm text-gray-700">{m.detail}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function addMonths(ym: string, months: number) {
  const [y, m] = ym.split('-').map(v => parseInt(v, 10))
  const dt = new Date(y, (m - 1) + months, 1)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  return `${yy}-${mm}`
}
