import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-medium/10 border border-medium/30 text-medium shadow-card">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-fg">Page Not Found</h1>
          <p className="text-sm text-fg-subtle leading-relaxed">
            The requested route does not exist in the PatchPilot client router.
            Check the URL, or go back to the homepage or the workspace.
          </p>
        </div>
        <div className="flex justify-center gap-2.5">
          <Link to="/">
            <Button
              variant="primary"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Homepage
            </Button>
          </Link>
          <Link to="/overview">
            <Button
              variant="secondary"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Workspace overview
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
