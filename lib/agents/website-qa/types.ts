export interface QAConfig {
  url: string;
  viewport?: 'desktop' | 'mobile' | 'tablet';
  waitForNetworkIdle?: boolean;
  waitTimeout?: number;
  checkAccessibility?: boolean;
  checkSEO?: boolean;
  checkPerformance?: boolean;
  customChecks?: QACustomCheck[];
}

export interface QACustomCheck {
  name: string;
  selector: string;
  attribute?: string;
  expectedValue?: string;
  shouldExist?: boolean;
}

export interface QAIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'javascript' | 'network' | 'visual' | 'accessibility' | 'seo' | 'performance' | 'custom';
  message: string;
  details?: Record<string, unknown>;
  selector?: string;
}

export interface QAReport {
  url: string;
  timestamp: string;
  viewport: string;
  passed: boolean;
  summary: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
  issues: QAIssue[];
  metrics?: QAMetrics;
  screenshots?: QAScreenshot[];
}

export interface QAMetrics {
  loadTime?: number;
  domContentLoaded?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
  totalBlockingTime?: number;
  resourceCount?: number;
  totalSize?: number;
}

export interface QAScreenshot {
  name: string;
  path: string;
  timestamp: string;
}

export interface QAResult {
  success: boolean;
  report: QAReport;
  error?: string;
}

export type QAAnalysisResult = "pass" | "warning" | "fail";
export interface QAAnalysis {
  result: QAAnalysisResult;
  score: number; // 0-100
  summary: string;
  recommendations: string[];
}