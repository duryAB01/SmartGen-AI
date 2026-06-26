import React, { useEffect, useRef } from 'react'

export default function ParticleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mouse = { x: null, y: null, radius: 130 }
    let particles = []
    let frameId = null
    let width = 0
    let height = 0

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = Math.floor(width * ratio)
      canvas.height = Math.floor(height * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

      const particleCount = width < 700 ? 34 : 82
      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        radius: Math.random() * 1.5 + 0.8
      }))
    }

    const drawParticle = (particle) => {
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(209, 217, 232, 0.42)'
      ctx.fill()
    }

    const updateParticle = (particle) => {
      if (!prefersReducedMotion) {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0 || particle.x > width) particle.vx *= -1
        if (particle.y < 0 || particle.y > height) particle.vy *= -1

        if (mouse.x !== null && mouse.y !== null) {
          const dx = particle.x - mouse.x
          const dy = particle.y - mouse.y
          const distance = Math.hypot(dx, dy)
          if (distance < mouse.radius && distance > 0) {
            const force = (mouse.radius - distance) / mouse.radius
            particle.x += (dx / distance) * force * 0.42
            particle.y += (dy / distance) * force * 0.42
          }
        }
      }

      drawParticle(particle)
    }

    const connectParticles = () => {
      for (let a = 0; a < particles.length; a += 1) {
        for (let b = a + 1; b < particles.length; b += 1) {
          const dx = particles[a].x - particles[b].x
          const dy = particles[a].y - particles[b].y
          const distance = Math.hypot(dx, dy)

          if (distance < 118) {
            const alpha = (1 - distance / 118) * 0.12
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(particles[a].x, particles[a].y)
            ctx.lineTo(particles[b].x, particles[b].y)
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      particles.forEach(updateParticle)
      connectParticles()
      frameId = window.requestAnimationFrame(animate)
    }

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = event.clientX - rect.left
      mouse.y = event.clientY - rect.top
    }

    const clearMouse = () => {
      mouse.x = null
      mouse.y = null
    }

    resize()
    animate()

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseout', clearMouse)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseout', clearMouse)
      if (frameId) window.cancelAnimationFrame(frameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="landing-particle-canvas" aria-hidden="true" />
}
