/*
 * Generates the extension's PNG icons (16/48/128) with no external deps.
 * Run with: node tools/gen-icons.mjs
 */
import zlib from 'node:zlib'
import { Buffer } from 'node:buffer'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '..', 'icons')
mkdirSync(iconsDir, { recursive: true })

// --- CRC32 -------------------------------------------------------------------
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function buildPng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = zlib.deflateSync(raw)
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// --- drawing -----------------------------------------------------------------
const BG = [79, 70, 229, 255] // indigo-600
const FG = [255, 255, 255, 255]

function inRoundedRect(x, y, size, r) {
  if (x < 0 || y < 0 || x >= size || y >= size) return false
  const x1 = size - 1
  const y1 = size - 1
  const inLeft = x < r
  const inRight = x > x1 - r
  const inTop = y < r
  const inBottom = y > y1 - r
  if (inLeft && inTop) return (x - r) ** 2 + (y - r) ** 2 <= r * r
  if (inRight && inTop) return (x - (x1 - r)) ** 2 + (y - r) ** 2 <= r * r
  if (inLeft && inBottom) return (x - r) ** 2 + (y - (y1 - r)) ** 2 <= r * r
  if (inRight && inBottom) return (x - (x1 - r)) ** 2 + (y - (y1 - r)) ** 2 <= r * r
  return true
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const cx = x1 + t * dx
  const cy = y1 + t * dy
  return Math.hypot(px - cx, py - cy)
}

function makeIcon(size) {
  const buf = Buffer.alloc(size * size * 4)
  const r = Math.max(1, Math.round(size * 0.22))
  const lensCx = size * 0.40
  const lensCy = size * 0.40
  const lensR = size * 0.20
  const ringW = Math.max(1, size * 0.08)
  const handleW = Math.max(1, size * 0.10)
  const ang = Math.PI / 4
  const hx1 = lensCx + Math.cos(ang) * lensR
  const hy1 = lensCy + Math.sin(ang) * lensR
  const hx2 = size * 0.80
  const hy2 = size * 0.80

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!inRoundedRect(x, y, size, r)) continue
      let color = BG
      const d = Math.hypot(x - lensCx, y - lensCy)
      if (d <= lensR && d >= lensR - ringW) color = FG
      if (distToSegment(x, y, hx1, hy1, hx2, hy2) <= handleW) color = FG
      const i = (y * size + x) * 4
      buf[i] = color[0]
      buf[i + 1] = color[1]
      buf[i + 2] = color[2]
      buf[i + 3] = color[3]
    }
  }
  return buildPng(size, size, buf)
}

for (const size of [16, 48, 128]) {
  const png = makeIcon(size)
  writeFileSync(join(iconsDir, `icon${size}.png`), png)
  console.log(`wrote icons/icon${size}.png (${png.length} bytes)`)
}
