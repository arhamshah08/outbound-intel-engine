'use client'
import { useRef, useEffect } from 'react'

type Node = { x: number; y: number; vx: number; vy: number; r: number }

export default function NetworkHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number
    let nodes: Node[] = []
    let W = 0, H = 0

    function init() {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.round((W * H) / 9000)
      nodes = Array.from({ length: Math.max(28, Math.min(count, 50)) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 1.2,
      }))
    }

    function draw() {
      // Background — warm cream gradient matching surface tokens
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#F5F2EE')
      bg.addColorStop(0.5, '#EDEAE5')
      bg.addColorStop(1, '#E8E4DF')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      const maxDist = 160

      // Triangle fills (very subtle warm wash)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dxij = nodes[i].x - nodes[j].x, dyij = nodes[i].y - nodes[j].y
          if (dxij * dxij + dyij * dyij > maxDist * maxDist) continue
          for (let k = j + 1; k < nodes.length; k++) {
            const dxjk = nodes[j].x - nodes[k].x, dyjk = nodes[j].y - nodes[k].y
            const dxik = nodes[i].x - nodes[k].x, dyik = nodes[i].y - nodes[k].y
            if (dxjk * dxjk + dyjk * dyjk > maxDist * maxDist) continue
            if (dxik * dxik + dyik * dyik > maxDist * maxDist) continue
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.lineTo(nodes[k].x, nodes[k].y)
            ctx.closePath()
            ctx.fillStyle = 'rgba(168, 157, 144, 0.045)'
            ctx.fill()
          }
        }
      }

      // Connecting lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist >= maxDist) continue
          const alpha = (1 - dist / maxDist) * 0.38
          ctx.beginPath()
          ctx.moveTo(nodes[i].x, nodes[i].y)
          ctx.lineTo(nodes[j].x, nodes[j].y)
          ctx.strokeStyle = `rgba(140, 130, 118, ${alpha})`
          ctx.lineWidth = 0.75
          ctx.stroke()
        }
      }

      // Nodes with glow
      for (const n of nodes) {
        // outer glow
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 7)
        grd.addColorStop(0, 'rgba(150, 138, 124, 0.25)')
        grd.addColorStop(1, 'rgba(150, 138, 124, 0)')
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * 7, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // core dot
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(120, 110, 98, 0.75)'
        ctx.fill()

        // bright centre pinpoint
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * 0.45, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(220, 210, 198, 0.9)'
        ctx.fill()
      }

      // Update
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > W) { n.vx *= -1; n.x = Math.max(0, Math.min(W, n.x)) }
        if (n.y < 0 || n.y > H) { n.vy *= -1; n.y = Math.max(0, Math.min(H, n.y)) }
      }

      animId = requestAnimationFrame(draw)
    }

    init()
    draw()

    const ro = new ResizeObserver(() => { init() })
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-2xl block"
      style={{ height: '192px' }}
    />
  )
}
