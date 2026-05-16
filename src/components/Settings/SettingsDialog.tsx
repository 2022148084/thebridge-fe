import type { ReactNode } from "react"
import { useState } from "react"

import ChangePassword from "@/components/UserSettings/ChangePassword"
import DeleteAccount from "@/components/UserSettings/DeleteAccount"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SettingsDialogProps {
  trigger: ReactNode
}

export function SettingsDialog({ trigger }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your password and account.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="password">
          <TabsList>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="danger-zone">Danger zone</TabsTrigger>
          </TabsList>
          <TabsContent value="password">
            <ChangePassword />
          </TabsContent>
          <TabsContent value="danger-zone">
            <DeleteAccount />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsDialog
