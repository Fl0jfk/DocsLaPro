import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import fs from 'fs'

export async function POST(req: Request) {
    try {
    const formData = await req.formData()
    const photos = formData.getAll('photos') as File[]
    const uploadDir = path.join(process.cwd(), 'uploads')
    if (!fs.existsSync(uploadDir)) { await mkdir(uploadDir, { recursive: true })}
    const attachments = []
    for (const file of photos) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filePath = path.join(uploadDir, file.name)
      await writeFile(filePath, buffer)
      attachments.push({ filename: file.name, path: filePath })
    }
    const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})
    await transporter.sendMail({
      from: `"Color-Run 2025" <${process.env.SMTP_USER}>`,
      to: 'p.hebert@ac-normandie.fr',
      subject: `📸 Photos Color-Run`,
      text: `Des photos ont été envoyées via le formulaire Color-Run.`,
      attachments,
    })
    attachments.forEach((a) => fs.unlink(a.path, () => {}))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erreur API Color-On:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}