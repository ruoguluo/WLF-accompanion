import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Users, Calendar, Award, ArrowRight, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import NavBar from '@/components/NavBar'

interface MentorItem {
  id: string
  name: string
  createdAt: string
  certificates?: string
  expertise?: string[]
}

export default function MentorCardList() {
  const [mentors, setMentors] = useState<MentorItem[]>([])

  useEffect(() => {
    axios.get('/api/mentors')
      .then(res => {
        if (res.data?.success) setMentors(res.data.data as MentorItem[])
      })
      .catch(() => setMentors([]))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar title="导师名片列表" />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">导师名片</h1>
          </div>
          <Link to="/create" className="text-indigo-600 hover:text-indigo-800 font-medium">创建导师名片</Link>
        </div>

        {mentors.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">暂无导师名片</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map(m => (
              <div key={m.id} className="bg-white rounded-lg border border-gray-200 shadow hover:shadow-lg transition-shadow">
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">{(m.name || '').trim() || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Award className="w-4 h-4 text-gray-500" />
                    <span>证书：{((m.certificates || '').trim()) || 'None'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                      <span>导师擅长解答的问题：</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(m.expertise || ['产品战略与定位','技术架构选型与落地','融资与商业模式设计']).slice(0,5).map((q, idx) => (
                        <span key={idx} className="inline-block bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded border border-indigo-200">{q}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={`/mentor-card-details/${m.id}`}
                      className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded"
                    >
                      <span>查看详情</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/mentor-courses/${m.id}`}
                      className="inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded"
                    >
                      <span>课程</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
