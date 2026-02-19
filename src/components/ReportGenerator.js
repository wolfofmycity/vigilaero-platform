import React, { useState } from 'react';
import { FileText, Download, Calendar, BarChart3, Shield, AlertTriangle } from 'lucide-react';

const ReportGenerator = ({ incidents = [], systemHealth, complianceData }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);

  const generateIncidentCSV = () => {
    const headers = ['Timestamp', 'Incident Type', 'Severity', 'Confidence', 'Pattern', 'Location', 'Status'];
    const csvData = [
      headers.join(','),
      ...incidents.map(incident => [
        incident.timestamp.toISOString(),
        incident.name,
        incident.severity,
        (incident.confidence * 100).toFixed(1) + '%',
        `"${incident.pattern}"`,
        `"${incident.location?.lat.toFixed(4)}, ${incident.location?.lng.toFixed(4)}"`,
        'Detected'
      ].join(','))
    ].join('\n');

    return csvData;
  };

  const generateComplianceSummary = () => {
    const summary = {
      generatedAt: new Date().toISOString(),
      overallCompliance: '92%',
      frameworks: complianceData || {
        faa: { score: 94, status: 'compliant' },
        easa: { score: 87, status: 'mostly_compliant' },
        iso42001: { score: 91, status: 'compliant' },
        iso27001: { score: 96, status: 'compliant' }
      },
      incidents: {
        total: incidents.length,
        bySeverity: {
          critical: incidents.filter(i => i.severity === 'CRITICAL').length,
          high: incidents.filter(i => i.severity === 'HIGH').length,
          medium: incidents.filter(i => i.severity === 'MEDIUM').length
        }
      },
      systemHealth: systemHealth || { uptime: 99.97, responseTime: 2.3 }
    };

    return summary;
  };

  const downloadCSV = (data, filename) => {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadJSON = (data, filename) => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generateIncidentReport = async () => {
    setIsGenerating(true);
    
    try {
      const csvData = generateIncidentCSV();
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `VigilAero-Incident-Report-${timestamp}.csv`;
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      downloadCSV(csvData, filename);
      
      setLastGenerated({ type: 'incident', timestamp: new Date(), filename });
      
      console.log('Incident report generated:', { incidents: incidents.length, filename });
      
    } catch (error) {
      console.error('Error generating incident report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateComplianceReport = async () => {
    setIsGenerating(true);
    
    try {
      const summary = generateComplianceSummary();
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `VigilAero-Compliance-Report-${timestamp}.json`;
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      downloadJSON(summary, filename);
      
      setLastGenerated({ type: 'compliance', timestamp: new Date(), filename });
      
      console.log('Compliance report generated:', summary);
      
    } catch (error) {
      console.error('Error generating compliance report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateExecutiveSummary = async () => {
    setIsGenerating(true);
    
    try {
      const executiveSummary = {
        reportType: 'Executive Security Summary',
        generatedAt: new Date().toISOString(),
        reportingPeriod: 'Last 24 Hours',
        keyMetrics: {
          systemUptime: systemHealth?.uptime || 99.97,
          averageResponseTime: systemHealth?.responseTime || 2.3,
          incidentCount: incidents.length,
          complianceScore: 92
        },
        securityPosture: {
          status: incidents.length === 0 ? 'SECURE' : 'MONITORING',
          activeThreats: incidents.length,
          mitigatedThreats: 0,
          falsePositives: 0
        },
        complianceSummary: {
          faa: '94% Compliant',
          easa: '87% Mostly Compliant', 
          iso42001: '91% Compliant',
          iso27001: '96% Compliant'
        },
        recommendations: [
          'Renew EASA insurance certificate within 7 days',
          'Schedule quarterly compliance review',
          'Update incident response procedures',
          'Review 3rd party vendor security assessments'
        ]
      };

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `VigilAero-Executive-Summary-${timestamp}.json`;
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      downloadJSON(executiveSummary, filename);
      
      setLastGenerated({ type: 'executive', timestamp: new Date(), filename });
      
      console.log('Executive summary generated:', executiveSummary);
      
    } catch (error) {
      console.error('Error generating executive summary:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-green-400 mr-3" />
            <h2 className="text-xl font-semibold text-white">Security Report Generator</h2>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Report Date: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
        
        <p className="text-gray-300">
          Generate comprehensive security and compliance reports for audit, analysis, and executive review.
        </p>
      </div>

      {lastGenerated && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Download className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-green-400 font-medium">Report Generated Successfully</p>
              <p className="text-gray-300 text-sm">
                {lastGenerated.filename} - {lastGenerated.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 mr-3 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Security Incident Report</h3>
          </div>
          
          <p className="text-gray-300 text-sm mb-4 min-h-12">
            Detailed report of all security incidents with timestamps and response actions
          </p>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Data Points:</span>
              <span className="text-white font-medium">{incidents.length}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Format:</span>
              <span className="text-white font-medium">CSV</span>
            </div>
            
            <button
              onClick={generateIncidentReport}
              disabled={isGenerating}
              className="w-full py-3 px-4 rounded-lg border bg-blue-600 hover:bg-blue-700 border-blue-500 text-blue-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Generate Report</span>
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 mr-3 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Regulatory Compliance Report</h3>
          </div>
          
          <p className="text-gray-300 text-sm mb-4 min-h-12">
            Comprehensive compliance status across all monitored frameworks
          </p>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Data Points:</span>
              <span className="text-white font-medium">4</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Format:</span>
              <span className="text-white font-medium">JSON</span>
            </div>
            
            <button
              onClick={generateComplianceReport}
              disabled={isGenerating}
              className="w-full py-3 px-4 rounded-lg border bg-green-600 hover:bg-green-700 border-green-500 text-green-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Generate Report</span>
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-6 h-6 mr-3 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Executive Summary Report</h3>
          </div>
          
          <p className="text-gray-300 text-sm mb-4 min-h-12">
            High-level security posture and key metrics for leadership review
          </p>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Format:</span>
              <span className="text-white font-medium">JSON</span>
            </div>
            
            <button
              onClick={generateExecutiveSummary}
              disabled={isGenerating}
              className="w-full py-3 px-4 rounded-lg border bg-purple-600 hover:bg-purple-700 border-purple-500 text-purple-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Generate Report</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
        <h3 className="text-white font-medium mb-4">Report Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="text-blue-400 font-medium mb-2">Available Report Types</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• <strong>Incident Reports:</strong> CSV format with detailed event logs</li>
              <li>• <strong>Compliance Reports:</strong> JSON format with framework assessments</li>
              <li>• <strong>Executive Summaries:</strong> High-level JSON with key metrics</li>
            </ul>
          </div>
          <div>
            <h4 className="text-blue-400 font-medium mb-2">Current System Status</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• <strong>Active Incidents:</strong> {incidents.length}</li>
              <li>• <strong>System Uptime:</strong> {systemHealth?.uptime || 99.97}%</li>
              <li>• <strong>Response Time:</strong> {systemHealth?.responseTime || 2.3}s avg</li>
              <li>• <strong>Compliance Score:</strong> 92% overall</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;