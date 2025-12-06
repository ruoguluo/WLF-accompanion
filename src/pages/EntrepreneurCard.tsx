import React, { useState } from 'react'
import NavBar from '@/components/NavBar'
import { Building2, Trophy, ChevronDown, ChevronUp, MapPin, Users, Briefcase, DollarSign, Layers, Calendar } from 'lucide-react'

type Milestone = { date: string; title: string; detail?: string }
type Journey = { start: string; milestones: Milestone[] }
type Entry = {
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

const sample: Entry[] = [
  {
    companyName: '星河数据科技有限公司',
    brandName: '星河云数',
    market: '中国大陆（B2B 企业服务）',
    industry: '数据基础设施与分析',
    staffSize: '120 人',
    businessScale: '年营收约 5000 万人民币',
    fundingScale: 'B 轮，累计融资 1.5 亿人民币',
    stage: '扩张期（产品矩阵成型，区域化拓展）',
    journey: {
      start: '2021-03',
      milestones: [
        { date: '2021-03', title: '公司成立', detail: '完成核心团队搭建，确定数据平台方向' },
        { date: '2021-10', title: '产品首版发布', detail: '上线自研数据湖与报表引擎' },
        { date: '2022-06', title: 'A 轮融资', detail: '获得顶级机构投资，加速研发与交付' },
        { date: '2023-02', title: '进入大型客户', detail: '签约 3 家央企集团级项目' },
        { date: '2024-08', title: 'B 轮融资', detail: '扩充销售与实施团队，开拓华东与华南市场' }
      ]
    }
  },
  {
    companyName: '橙果消费科技',
    brandName: '橙果 Lite',
    market: '东南亚跨境电商',
    industry: 'DTC 消费品牌与供应链',
    staffSize: '65 人',
    businessScale: '年 GMV 约 8000 万人民币',
    fundingScale: 'A 轮，融资 5000 万人民币',
    stage: '规模化运营（多品类扩张）',
    journey: {
      start: '2020-05',
      milestones: [
        { date: '2020-05', title: '启动', detail: '完成品牌定位与首批选品' },
        { date: '2021-01', title: '月 GMV 破 500 万', detail: '打通物流与本地履约网络' },
        { date: '2022-03', title: 'A 轮融资', detail: '搭建私域与会员体系' },
        { date: '2023-09', title: '多品牌并行', detail: '进入家居与美妆赛道' }
      ]
    }
  }
]

export default function EntrepreneurCard() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <NavBar title="人员名片" />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-2 mb-6">
          <Trophy className="w-5 h-5 text-amber-600" />
          <h1 className="text-2xl font-bold text-gray-900">创业成功经历</h1>
        </div>
        <div className="space-y-6">
          {sample.map((e, i) => {
            const open = openIdx === i
            return (
              <div key={i} className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <span className="text-lg font-semibold text-gray-900">{e.companyName}</span>
                    </div>
                    <div className="text-sm text-gray-600">品牌：{e.brandName}</div>
                    <div className="text-sm text-gray-600">市场：{e.market}</div>
                    <div className="text-sm text-gray-600">行业：{e.industry}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenIdx(open ? null : i)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                  >
                    <span>{open ? '收起详情' : '查看详情'}</span>
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                {open && (
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2"><MapPin className="w-4 h-4 text-gray-500" /><span>市场：{e.market}</span></div>
                      <div className="flex items-center space-x-2"><Layers className="w-4 h-4 text-gray-500" /><span>行业：{e.industry}</span></div>
                      <div className="flex items-center space-x-2"><Users className="w-4 h-4 text-gray-500" /><span>人员规模：{e.staffSize}</span></div>
                      <div className="flex items-center space-x-2"><Briefcase className="w-4 h-4 text-gray-500" /><span>业务规模：{e.businessScale}</span></div>
                      <div className="flex items-center space-x-2"><DollarSign className="w-4 h-4 text-gray-500" /><span>融资规模：{e.fundingScale}</span></div>
                      <div className="flex items-center space-x-2"><Layers className="w-4 h-4 text-gray-500" /><span>业务阶段：{e.stage}</span></div>
                    </div>
                    <div className="mt-6">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-900 font-semibold">创业历程</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-3">开始时间：{e.journey.start}</div>
                      <div className="space-y-3">
                        {e.journey.milestones.map((m, idx) => (
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
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

