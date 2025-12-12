'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText, Code, Server } from 'lucide-react';

interface NextJSError {
  type: 'build' | 'runtime' | 'type';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
}

interface NextJSPageMetadata {
  route: string;
  component: string;
  layout?: string;
  rendering: 'ssr' | 'ssg' | 'isr' | 'csr';
}

interface NextJSServerAction {
  id: string;
  file: string;
  function: string;
}

interface NextJSDevToolsResultsProps {
  toolName: string;
  result: any;
}

export function NextJSDevToolsResults({ toolName, result }: NextJSDevToolsResultsProps) {
  if (toolName === 'nextjs_get_errors' || toolName.includes('get_errors')) {
    return <ErrorsDisplay result={result} />;
  }
  
  if (toolName === 'nextjs_get_logs' || toolName.includes('get_logs')) {
    return <LogsDisplay result={result} />;
  }
  
  if (toolName === 'nextjs_get_page_metadata' || toolName.includes('get_page_metadata')) {
    return <PageMetadataDisplay result={result} />;
  }
  
  if (toolName === 'nextjs_get_server_action_by_id' || toolName.includes('get_server_action')) {
    return <ServerActionDisplay result={result} />;
  }

  return <GenericDisplay result={result} />;
}

function ErrorsDisplay({ result }: { result: any }) {
  let errors: NextJSError[] = [];
  
  if (Array.isArray(result)) {
    errors = result;
  } else if (result?.errors) {
    errors = result.errors;
  } else if (result?.content) {
    if (Array.isArray(result.content)) {
      errors = result.content;
    }
  }

  if (errors.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">No errors found! 🎉</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Next.js Errors ({errors.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {errors.map((error, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={error.type === 'runtime' ? 'destructive' : 'secondary'}>
                {error.type}
              </Badge>
              {error.file && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {error.file}
                  {error.line && `:${error.line}`}
                  {error.column && `:${error.column}`}
                </span>
              )}
            </div>
            <div className="text-sm font-medium">{error.message}</div>
            {error.stack && (
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                {error.stack}
              </pre>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LogsDisplay({ result }: { result: any }) {
  const logs = typeof result === 'string' ? result : result?.text || result?.content || JSON.stringify(result, null, 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Development Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
          {logs}
        </pre>
      </CardContent>
    </Card>
  );
}

function PageMetadataDisplay({ result }: { result: any }) {
  const metadata: NextJSPageMetadata = result?.content || result;

  if (!metadata) {
    return <GenericDisplay result={result} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Page Metadata
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-xs text-muted-foreground">Route</div>
          <div className="text-sm font-medium">{metadata.route}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Component</div>
          <div className="text-sm font-medium">{metadata.component}</div>
        </div>
        {metadata.layout && (
          <div>
            <div className="text-xs text-muted-foreground">Layout</div>
            <div className="text-sm font-medium">{metadata.layout}</div>
          </div>
        )}
        <div>
          <div className="text-xs text-muted-foreground">Rendering</div>
          <Badge variant="outline">{metadata.rendering?.toUpperCase()}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ServerActionDisplay({ result }: { result: any }) {
  const action: NextJSServerAction = result?.content || result;

  if (!action) {
    return <GenericDisplay result={result} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Server Action
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-xs text-muted-foreground">ID</div>
          <div className="text-sm font-mono">{action.id}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">File</div>
          <div className="text-sm font-medium">{action.file}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Function</div>
          <div className="text-sm font-medium">{action.function}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function GenericDisplay({ result }: { result: any }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

