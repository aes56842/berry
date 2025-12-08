"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/app/lib/supabaseClient"
import Image from "next/image"
import Link from "next/link"

interface Student {
  id: string
  email: string
  first_name: string
  last_name: string
  date_of_birth: string
  school: string
  grade_level: string
  gpa: number
  age_verified: boolean
  onboarding_completed: boolean
  created_at: string
}

export default function AdminStudentsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { first_name?: string; last_name?: string; role?: string } } | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push("/auth?mode=signin")
        return
      }

      const userRole = session.user.user_metadata?.role
      if (userRole !== 'admin') {
        router.push('/dashboard')
        return
      }

      setUser(session.user)
      fetchStudents()
    }

    checkUser()
  }, [router])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return
    }

    setActionLoading(studentId)
    try {
      const response = await fetch('/api/admin/students', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId })
      })

      if (response.ok) {
        await fetchStudents()
      } else {
        alert('Failed to delete student')
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Error deleting student')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth?mode=signin")
  }

  const filteredStudents = students.filter(student => {
    const search = searchTerm.toLowerCase()
    return (
      student.first_name?.toLowerCase().includes(search) ||
      student.last_name?.toLowerCase().includes(search) ||
      student.email?.toLowerCase().includes(search) ||
      student.school?.toLowerCase().includes(search)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#004aad]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#004aad] text-white font-[Marble]">
      {/* Top bar */}
      <nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard/admin" className="flex items-center">
              <Image
                src="/logos/BERRY%20LOGO%20%28svg%29.png"
                alt="BERRY logo"
                width={160}
                height={60}
                className="h-auto w-40 max-w-full select-none"
                priority
              />
            </Link>

            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-full border border-white/60 text-sm font-[Marble] hover:bg-white hover:text-[#004aad] transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center text-[#52b2bf] hover:text-[#f77fbe] transition-colors mb-4"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl mb-2 text-[#f77fbe]">All Students</h1>
          <p className="text-lg text-blue-100">Manage all registered students</p>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, or school..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/40 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#f77fbe]"
          />
        </div>

        {/* Stats */}
        <div className="mb-6 bg-white/10 rounded-2xl p-4 border border-white/40">
          <p className="text-lg">
            Total Students: <span className="text-[#52b2bf] font-bold">{filteredStudents.length}</span>
            {searchTerm && <span className="text-sm ml-2">(filtered from {students.length})</span>}
          </p>
        </div>

        {/* Students table */}
        <div className="bg-white/10 rounded-3xl border-2 border-white/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/20">
              <thead className="bg-[#003580]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">School</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">GPA</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-blue-200">
                      {searchTerm ? 'No students found matching your search.' : 'No students registered yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {student.first_name} {student.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-100">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-100">
                        {student.school}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-100">
                        {student.grade_level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-100">
                        {student.gpa ? student.gpa.toFixed(2) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-100">
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          disabled={actionLoading === student.id}
                          className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === student.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
