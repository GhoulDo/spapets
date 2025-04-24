"use client"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface TimePickerDemoProps {
  setHour: (hour: string) => void
  hour: string
}

export function TimePickerDemo({ setHour, hour }: TimePickerDemoProps) {
  const availableHours = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 opacity-50" />
        <Label htmlFor="hours" className="text-xs font-medium">
          Horario disponible
        </Label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {availableHours.map((timeSlot) => (
          <Button
            key={timeSlot}
            variant={hour === timeSlot ? "default" : "outline"}
            className={`text-xs ${hour === timeSlot ? "bg-green-700 hover:bg-green-800" : ""}`}
            onClick={() => setHour(timeSlot)}
            type="button"
          >
            {timeSlot}
          </Button>
        ))}
      </div>
    </div>
  )
}
