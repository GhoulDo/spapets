"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"

// Registrar los componentes necesarios de Chart.js
Chart.register(...registerables)

interface ChartData {
  name: string
  value: number
}

export function PieChart({ data }: { data: ChartData[] }) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Destruir el gráfico anterior si existe
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Crear el nuevo gráfico
    chartInstance.current = new Chart(ctx, {
      type: "pie",
      data: {
        labels: data.map((item) => item.name),
        datasets: [
          {
            data: data.map((item) => item.value),
            backgroundColor: [
              "rgba(255, 107, 107, 0.8)", // #FF6B6B - pet-primary
              "rgba(78, 205, 196, 0.8)", // #4ECDC4 - pet-secondary
              "rgba(255, 209, 102, 0.8)", // #FFD166 - pet-tertiary
              "rgba(69, 183, 209, 0.8)", // #45B7D1 - pet-blue
              "rgba(255, 143, 186, 0.8)", // #FF8FBA - pet-pink
            ],
            borderColor: [
              "rgba(255, 107, 107, 1)",
              "rgba(78, 205, 196, 1)",
              "rgba(255, 209, 102, 1)",
              "rgba(69, 183, 209, 1)",
              "rgba(255, 143, 186, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 15,
              padding: 15,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || ""
                const value = context.raw as number
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                const percentage = Math.round((value / total) * 100)
                return `${label}: ${value} (${percentage}%)`
              },
            },
          },
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data])

  return <canvas ref={chartRef} />
}

export function BarChart({ data }: { data: ChartData[] }) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Destruir el gráfico anterior si existe
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Crear el nuevo gráfico
    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((item) => item.name),
        datasets: [
          {
            label: "Ingresos (€)",
            data: data.map((item) => item.value),
            backgroundColor: "rgba(255, 107, 107, 0.8)", // #FF6B6B - pet-primary
            borderColor: "rgba(255, 107, 107, 1)",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: "rgba(0, 0, 0, 0.05)",
            },
            ticks: {
              callback: (value) => "€" + value,
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number
                return `Ingresos: €${value}`
              },
            },
          },
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data])

  return <canvas ref={chartRef} />
}
