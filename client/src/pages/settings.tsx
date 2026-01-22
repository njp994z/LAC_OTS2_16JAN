import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, ArrowLeft, User, Bell, Lock, Palette } from "lucide-react";

export default function Settings() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/demo" data-testid="link-back-demo">
              <Button variant="ghost" size="icon" className="gap-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
            </div>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <CardTitle data-testid="title-account-settings">Account Settings</CardTitle>
                </div>
                <CardDescription>
                  Manage your account information and profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Configure your account settings including:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Profile information</li>
                    <li>Email preferences</li>
                    <li>Account security</li>
                  </ul>
                </div>
                <Button variant="outline" data-testid="button-edit-account">
                  Edit Account
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <CardTitle data-testid="title-notifications">Notifications</CardTitle>
                </div>
                <CardDescription>
                  Control your notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Manage notifications for:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Training reminders</li>
                    <li>System alerts</li>
                    <li>Safety updates</li>
                  </ul>
                </div>
                <Button variant="outline" data-testid="button-edit-notifications">
                  Configure Notifications
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  <CardTitle data-testid="title-security">Security</CardTitle>
                </div>
                <CardDescription>
                  Password and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Security options:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Change password</li>
                    <li>Two-factor authentication</li>
                    <li>Active sessions</li>
                  </ul>
                </div>
                <Button variant="outline" data-testid="button-edit-security">
                  Manage Security
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  <CardTitle data-testid="title-appearance">Appearance</CardTitle>
                </div>
                <CardDescription>
                  Customize the look and feel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Appearance settings:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Theme selection (Light/Dark)</li>
                    <li>Display preferences</li>
                    <li>Accessibility options</li>
                  </ul>
                </div>
                <Button variant="outline" data-testid="button-edit-appearance">
                  Customize Appearance
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
