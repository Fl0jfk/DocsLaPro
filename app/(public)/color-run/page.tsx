'use client'
import { useState } from 'react'

export default function ColorOnForm() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault()
    setLoading(true)
    const formData = new FormData()
    if (files) {
      Array.from(files).forEach((file) => formData.append('photos', file))
    }
    const res = await fetch('/api/colorun', { method: 'POST', body: formData,})
    setLoading(false)
    if (res.ok) setSent(true)
  }
  const isDisabled = loading || !files || files.length === 0
  if (sent)
    return (
      <>
        <p className="text-center text-green-600 font-semibold">✅ Merci ! Tes fichiers ont bien été envoyés.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto p-6 bg-white shadow rounded-2xl">
          <h1 className="text-2xl font-bold text-center">Color-Run 2025</h1>
          <p className="text-center text-gray-600">Partage tes photos si tu veux, c’est facultatif !</p>
          <input   type="file" name="photos" multiple  accept="image/*"  onChange={(e) => setFiles(e.target.files)} className="border rounded p-2"/>
          <button  type="submit"  disabled={isDisabled} className="bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600 disabled:opacity-50">{loading ? 'Envoi en cours...' : 'Envoyer'}</button>
        </form>
      </>
    )
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto p-6 bg-white shadow rounded-2xl">
      <h1 className="text-2xl font-bold text-center">Color-Run 2025</h1>
      <p className="text-center text-gray-600">Partage tes photos si tu veux, c’est facultatif !</p>
      <input  type="file" name="photos" multiple  accept="image/*"  onChange={(e) => setFiles(e.target.files)} className="border rounded p-2"/>
      <button type="submit"  disabled={isDisabled} className="bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600 disabled:opacity-50">{loading ? 'Envoi en cours...' : 'Envoyer'}</button>
    </form>
  )
}