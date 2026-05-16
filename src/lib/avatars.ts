import {
  Activity,
  Bike,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  type LucideIcon,
  Mountain,
  Sparkles,
  Star,
  Sun,
  Trophy,
  Zap,
} from "lucide-react"

export type AvatarPreset = {
  bg: string
  Icon: LucideIcon
}

export const AVATARS: AvatarPreset[] = [
  { bg: "bg-red-500", Icon: Flame },
  { bg: "bg-orange-500", Icon: Sun },
  { bg: "bg-amber-500", Icon: Trophy },
  { bg: "bg-lime-500", Icon: Footprints },
  { bg: "bg-green-500", Icon: Mountain },
  { bg: "bg-emerald-500", Icon: Activity },
  { bg: "bg-teal-500", Icon: Heart },
  { bg: "bg-cyan-500", Icon: Bike },
  { bg: "bg-blue-500", Icon: Dumbbell },
  { bg: "bg-indigo-500", Icon: Zap },
  { bg: "bg-violet-500", Icon: Sparkles },
  { bg: "bg-pink-500", Icon: Star },
]
