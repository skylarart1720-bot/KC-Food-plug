import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'

const server = spawn(process.execPath, ['preview-server-fixed.js'], { stdio: 'ignore' })
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
try {
  let ready = false
  for (let attempt = 0; attempt < 20 && !ready; attempt += 1) {
    await wait(250)
    try { ready = (await fetch('http://127.0.0.1:3000/')).ok } catch {}
  }
  if (!ready) throw new Error('Local preview server did not start during the Vercel build.')
  await mkdir('public', { recursive: true })
  let storefront = await (await fetch('http://127.0.0.1:3000/')).text()
  storefront = storefront.replace("window.open('https://wa.me/233501242319?text='+encodeURIComponent(text),'_blank')", "window.location.assign('https://wa.me/233501242319?text='+encodeURIComponent(text))")
  await writeFile('public/index.html', storefront)
  await writeFile('public/dashboard.html', await (await fetch('http://127.0.0.1:3000/dashboard')).text())
} finally {
  server.kill()
}
