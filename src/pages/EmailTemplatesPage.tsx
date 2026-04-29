
import React, { useState } from 'react';
import ModernLayout from '@/components/layout/ModernLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEmailTemplates, type EmailTemplate } from '@/hooks/useEmailTemplates';
import { Mail, Edit2, Info, Loader2, Save, X, Code } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';

const EmailTemplatesPage = () => {
  const { templates, isLoading, updateTemplate, isUpdating } = useEmailTemplates();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({});

  const startEditing = (template: EmailTemplate) => {
    setEditingId(template.id);
    setFormData(template);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleSave = () => {
    if (editingId && formData) {
      updateTemplate({
        id: editingId,
        ...formData
      });
      setEditingId(null);
    }
  };

  return (
    <ModernLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
            <p className="text-muted-foreground">
              Customize the emails sent from your organization.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6">
            {templates.map((template) => (
              <Card key={template.id} className={`transition-all duration-300 ${editingId === template.id ? 'ring-2 ring-primary border-transparent' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl capitalize">
                        {template.name.replace(/_/g, ' ')}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                  </div>
                  {!editingId && (
                    <Button variant="outline" size="sm" onClick={() => startEditing(template)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Template
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {editingId === template.id ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4 pt-2"
                      >
                        <Alert className="bg-blue-50 border-blue-200">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertTitle className="text-blue-800">Placeholders</AlertTitle>
                          <AlertDescription className="text-blue-700">
                            Available variables: {template.placeholders.map(p => `{{${p}}}`).join(', ')}
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                          <Label htmlFor="subject">Email Subject</Label>
                          <Input
                            id="subject"
                            value={formData.subject || ''}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="body" className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            HTML Body Content
                          </Label>
                          <Textarea
                            id="body"
                            className="min-h-[300px] font-mono text-sm bg-slate-950 text-slate-100 p-4 border-none focus-visible:ring-1 ring-primary"
                            value={formData.body_html || ''}
                            onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-4">
                          <Button variant="ghost" onClick={cancelEditing}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button onClick={handleSave} disabled={isUpdating}>
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Template
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs uppercase text-muted-foreground font-semibold">Subject Line</Label>
                          <p className="text-lg font-medium">{template.subject}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-md max-h-[150px] overflow-hidden relative">
                          <div className="opacity-50 text-sm italic mb-2">HTML Content Preview:</div>
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap truncate h-20">
                            {template.body_html}
                          </pre>
                          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-muted to-transparent" />
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ModernLayout>
  );
};

export default EmailTemplatesPage;

