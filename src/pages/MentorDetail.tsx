import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import ResultsDisplay from '@/components/ResultsDisplay'
import NavBar from '@/components/NavBar'

export default function MentorDetail() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    axios.get(`/api/mentors/${id}`)
      .then(res => {
        if (res.data?.success) setData(res.data.data)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>
  if (!data) return <div className="min-h-screen flex items-center justify-center text-gray-600">Not found</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar title="导师名片详情" />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/mentors" className="text-blue-600 hover:text-blue-800 font-medium">返回列表</Link>
        </div>
        <ResultsDisplay data={data} />
      </div>
    </div>
  )
}
