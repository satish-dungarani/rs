import { useState } from 'react';
import {
  X,
  BookOpen,
  Server,
  Globe,
  Terminal,
  Shield,
  Wifi,
  CheckCircle2,
  Copy,
  ChevronDown,
  ChevronRight,
  Monitor,
  HardDrive,
  Network,
  Settings,
  FileCode,
  Package,
  Play,
  ExternalLink,
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Section = 'overview' | 'prerequisites' | 'build' | 'iis' | 'network' | 'troubleshooting';

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const CodeBlock = ({ code, id, language = 'bash' }: { code: string; id: string; language?: string }) => (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto font-mono">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy to clipboard"
      >
        {copiedCommand === id ? (
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-gray-300" />
        )}
      </button>
    </div>
  );

  const StepAccordion = ({
    stepId,
    number,
    title,
    children,
  }: {
    stepId: string;
    number: number;
    title: string;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSteps[stepId] !== false; // Default to expanded
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleStep(stepId)}
          className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
            {number}
          </span>
          <span className="font-medium text-gray-800 flex-1">{title}</span>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {isExpanded && <div className="p-4 space-y-4 bg-white">{children}</div>}
      </div>
    );
  };

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'prerequisites', label: 'Prerequisites', icon: <Package className="w-4 h-4" /> },
    { id: 'build', label: 'Build App', icon: <Terminal className="w-4 h-4" /> },
    { id: 'iis', label: 'Deploy to IIS', icon: <Server className="w-4 h-4" /> },
    { id: 'network', label: 'Network Access', icon: <Globe className="w-4 h-4" /> },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0 bg-gradient-to-r from-indigo-500 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Installation & Deployment Guide</h2>
              <p className="text-sm text-indigo-100">Host this app locally and access from your network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <nav className="w-56 bg-gray-50 border-r border-gray-200 p-4 shrink-0 overflow-y-auto hidden md:block">
            <ul className="space-y-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden border-b border-gray-200 p-2 overflow-x-auto shrink-0 bg-gray-50">
            <div className="flex gap-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeSection === section.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {section.icon}
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">📘 Overview</h3>
                  <p className="text-gray-600 leading-relaxed">
                    This guide will help you deploy the <strong>My Personal Diary</strong> application
                    on your local computer and make it accessible to all devices on your local network
                    (phones, tablets, other computers).
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Monitor className="w-6 h-6 text-blue-600" />
                      <h4 className="font-semibold text-gray-800">Local Hosting</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Run the app on your computer using IIS (Internet Information Services) — 
                      Microsoft's built-in web server for Windows.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Network className="w-6 h-6 text-green-600" />
                      <h4 className="font-semibold text-gray-800">Network Access</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Access the diary from any device on your WiFi/LAN network using your 
                      computer's IP address.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <HardDrive className="w-6 h-6 text-purple-600" />
                      <h4 className="font-semibold text-gray-800">Local Storage</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      All data is stored in a JSON file on your computer — no cloud, no external 
                      servers, 100% private.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-6 h-6 text-amber-600" />
                      <h4 className="font-semibold text-gray-800">Secure & Private</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Only accessible within your local network. Data never leaves your computer 
                      or local network.
                    </p>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                  <h4 className="font-semibold text-indigo-800 mb-2">🎯 What You'll Achieve</h4>
                  <ul className="space-y-2 text-sm text-indigo-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                      App running on IIS at <code className="bg-indigo-100 px-1.5 py-0.5 rounded">http://localhost/diary</code>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                      Accessible from any device via <code className="bg-indigo-100 px-1.5 py-0.5 rounded">http://192.168.x.x/diary</code>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                      Automatic startup with Windows (IIS runs as a service)
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Prerequisites Section */}
            {activeSection === 'prerequisites' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">📦 Prerequisites</h3>
                  <p className="text-gray-600">Make sure you have the following installed before proceeding.</p>
                </div>

                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">IIS (Internet Information Services)</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          You mentioned IIS is already installed. ✅
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          If not installed, go to: Control Panel → Programs → Turn Windows features on or off → 
                          Check "Internet Information Services"
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <FileCode className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Node.js (for building)</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Required to build the production files. Download from nodejs.org
                        </p>
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-2">Check if installed:</p>
                          <CodeBlock code="node --version" id="node-version" />
                        </div>
                        <a
                          href="https://nodejs.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mt-3"
                        >
                          Download Node.js <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <Globe className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Modern Browser</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Google Chrome or Microsoft Edge required for File System Access API.
                        </p>
                        <p className="text-xs text-amber-600 mt-2">
                          ⚠️ Firefox and Safari do NOT support this feature.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Build Section */}
            {activeSection === 'build' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">🔨 Build the Application</h3>
                  <p className="text-gray-600">
                    Follow these steps to create production-ready files.
                  </p>
                </div>

                <div className="space-y-4">
                  <StepAccordion stepId="build-1" number={1} title="Download/Clone the Project">
                    <p className="text-sm text-gray-600 mb-3">
                      Get the project source code on your computer. Place it in a folder like:
                    </p>
                    <CodeBlock code="C:\Projects\my-diary-app" id="project-path" />
                  </StepAccordion>

                  <StepAccordion stepId="build-2" number={2} title="Open Terminal/Command Prompt">
                    <p className="text-sm text-gray-600 mb-3">
                      Open Command Prompt or PowerShell and navigate to the project folder:
                    </p>
                    <CodeBlock code="cd C:\Projects\my-diary-app" id="cd-project" />
                  </StepAccordion>

                  <StepAccordion stepId="build-3" number={3} title="Install Dependencies">
                    <p className="text-sm text-gray-600 mb-3">
                      Install all required Node.js packages:
                    </p>
                    <CodeBlock code="npm install" id="npm-install" />
                    <p className="text-xs text-gray-500 mt-2">
                      This may take a few minutes on first run.
                    </p>
                  </StepAccordion>

                  <StepAccordion stepId="build-4" number={4} title="Build for Production">
                    <p className="text-sm text-gray-600 mb-3">
                      Create optimized production files:
                    </p>
                    <CodeBlock code="npm run build" id="npm-build" />
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                      <p className="text-sm text-green-800">
                        ✅ This creates a <code className="bg-green-100 px-1 rounded">dist</code> folder 
                        containing <code className="bg-green-100 px-1 rounded">index.html</code> — 
                        a single file with everything bundled!
                      </p>
                    </div>
                  </StepAccordion>

                  <StepAccordion stepId="build-5" number={5} title="Verify the Build">
                    <p className="text-sm text-gray-600 mb-3">
                      Check that the dist folder was created:
                    </p>
                    <CodeBlock code={`dir dist\n\n# You should see:\n# index.html`} id="verify-build" />
                  </StepAccordion>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="font-semibold text-amber-800 mb-2">💡 Quick Test (Optional)</h4>
                  <p className="text-sm text-amber-700">
                    You can test the build locally before deploying to IIS:
                  </p>
                  <div className="mt-3">
                    <CodeBlock code="npm run preview" id="npm-preview" />
                  </div>
                  <p className="text-xs text-amber-600 mt-2">
                    This starts a local server at http://localhost:4173
                  </p>
                </div>
              </div>
            )}

            {/* IIS Section */}
            {activeSection === 'iis' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">🖥️ Deploy to IIS</h3>
                  <p className="text-gray-600">
                    Configure IIS to host your diary application.
                  </p>
                </div>

                <div className="space-y-4">
                  <StepAccordion stepId="iis-1" number={1} title="Open IIS Manager">
                    <p className="text-sm text-gray-600 mb-3">
                      Press <kbd className="px-2 py-1 bg-gray-100 border rounded text-xs">Win + R</kbd>, 
                      type the following, and press Enter:
                    </p>
                    <CodeBlock code="inetmgr" id="inetmgr" />
                    <p className="text-sm text-gray-600 mt-3">
                      Or search for "IIS Manager" in the Start menu.
                    </p>
                  </StepAccordion>

                  <StepAccordion stepId="iis-2" number={2} title="Create Application Folder">
                    <p className="text-sm text-gray-600 mb-3">
                      Copy the built files to IIS web root. By default, this is:
                    </p>
                    <CodeBlock code="C:\inetpub\wwwroot\diary" id="iis-folder" />
                    <p className="text-sm text-gray-600 mt-3">
                      Create the <code className="bg-gray-100 px-1 rounded">diary</code> folder and copy 
                      everything from your project's <code className="bg-gray-100 px-1 rounded">dist</code> folder into it.
                    </p>
                    <div className="mt-3">
                      <CodeBlock 
                        code={`# In Command Prompt (Run as Administrator):\nmkdir C:\\inetpub\\wwwroot\\diary\nxcopy /E /I "C:\\Projects\\my-diary-app\\dist\\*" "C:\\inetpub\\wwwroot\\diary\\"`} 
                        id="copy-files" 
                      />
                    </div>
                  </StepAccordion>

                  <StepAccordion stepId="iis-3" number={3} title="Create IIS Application (Optional)">
                    <p className="text-sm text-gray-600 mb-3">
                      In IIS Manager:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                      <li>Expand your server name in the left panel</li>
                      <li>Expand "Sites"</li>
                      <li>Right-click "Default Web Site"</li>
                      <li>Click "Add Application..."</li>
                      <li>Set Alias: <code className="bg-gray-100 px-1 rounded">diary</code></li>
                      <li>Set Physical path: <code className="bg-gray-100 px-1 rounded">C:\inetpub\wwwroot\diary</code></li>
                      <li>Click OK</li>
                    </ol>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                      <p className="text-sm text-blue-800">
                        💡 If you just copied files to wwwroot\diary, you can skip creating an application — 
                        it will work as a virtual directory automatically.
                      </p>
                    </div>
                  </StepAccordion>

                  <StepAccordion stepId="iis-4" number={4} title="Configure MIME Types (if needed)">
                    <p className="text-sm text-gray-600 mb-3">
                      IIS should handle HTML files by default. If you get errors, add this web.config 
                      file to your diary folder:
                    </p>
                    <CodeBlock 
                      code={`<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
    <defaultDocument>
      <files>
        <add value="index.html" />
      </files>
    </defaultDocument>
  </system.webServer>
</configuration>`} 
                      id="webconfig" 
                      language="xml"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Save this as <code className="bg-gray-100 px-1 rounded">C:\inetpub\wwwroot\diary\web.config</code>
                    </p>
                  </StepAccordion>

                  <StepAccordion stepId="iis-5" number={5} title="Test Locally">
                    <p className="text-sm text-gray-600 mb-3">
                      Open your browser and visit:
                    </p>
                    <CodeBlock code="http://localhost/diary" id="localhost-test" />
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                      <p className="text-sm text-green-800">
                        ✅ If you see the diary app, IIS is configured correctly!
                      </p>
                    </div>
                  </StepAccordion>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">📁 Recommended Data Folder</h4>
                  <p className="text-sm text-purple-700">
                    Create a folder for storing diary data that all network users can access:
                  </p>
                  <div className="mt-3">
                    <CodeBlock code="C:\DiaryData" id="data-folder" />
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    When users connect, they should all select this same folder so everyone accesses the shared database.
                  </p>
                </div>
              </div>
            )}

            {/* Network Access Section */}
            {activeSection === 'network' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">🌐 Network Access Setup</h3>
                  <p className="text-gray-600">
                    Allow other devices on your local network to access the diary.
                  </p>
                </div>

                <div className="space-y-4">
                  <StepAccordion stepId="net-1" number={1} title="Find Your Computer's IP Address">
                    <p className="text-sm text-gray-600 mb-3">
                      Open Command Prompt and run:
                    </p>
                    <CodeBlock code="ipconfig" id="ipconfig" />
                    <p className="text-sm text-gray-600 mt-3">
                      Look for <strong>"IPv4 Address"</strong> under your active network adapter. 
                      It typically looks like:
                    </p>
                    <CodeBlock code="IPv4 Address. . . . . . . . . . . : 192.168.1.100" id="ip-example" />
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                      <p className="text-sm text-blue-800">
                        📝 Write down this IP address — you'll need it!
                      </p>
                    </div>
                  </StepAccordion>

                  <StepAccordion stepId="net-2" number={2} title="Configure Windows Firewall">
                    <p className="text-sm text-gray-600 mb-3">
                      Allow HTTP traffic through the firewall. Open PowerShell as Administrator and run:
                    </p>
                    <CodeBlock 
                      code={`# Allow HTTP (port 80) through firewall
New-NetFirewallRule -DisplayName "IIS HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow`} 
                      id="firewall-rule" 
                    />
                    <p className="text-sm text-gray-600 mt-3">Or manually via GUI:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 mt-2">
                      <li>Open "Windows Defender Firewall"</li>
                      <li>Click "Advanced settings"</li>
                      <li>Click "Inbound Rules" → "New Rule..."</li>
                      <li>Select "Port" → Next</li>
                      <li>Select "TCP", enter "80" → Next</li>
                      <li>Select "Allow the connection" → Next</li>
                      <li>Check all profiles (Domain, Private, Public) → Next</li>
                      <li>Name it "IIS HTTP Access" → Finish</li>
                    </ol>
                  </StepAccordion>

                  <StepAccordion stepId="net-3" number={3} title="Access from Other Devices">
                    <p className="text-sm text-gray-600 mb-3">
                      On any device connected to the same WiFi/network, open Chrome or Edge and visit:
                    </p>
                    <CodeBlock code="http://192.168.1.100/diary" id="network-url" />
                    <p className="text-xs text-gray-500 mt-2">
                      Replace <code>192.168.1.100</code> with your actual IP address from Step 1.
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                      <p className="text-sm text-green-800">
                        ✅ The diary app should now load on phones, tablets, and other computers!
                      </p>
                    </div>
                  </StepAccordion>

                  <StepAccordion stepId="net-4" number={4} title="Set a Static IP (Recommended)">
                    <p className="text-sm text-gray-600 mb-3">
                      To prevent your IP from changing, set a static IP:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                      <li>Open "Network and Internet Settings"</li>
                      <li>Click "Change adapter options"</li>
                      <li>Right-click your network adapter → "Properties"</li>
                      <li>Select "Internet Protocol Version 4 (TCP/IPv4)" → "Properties"</li>
                      <li>Select "Use the following IP address"</li>
                      <li>Enter your current IP, subnet mask (usually 255.255.255.0), and gateway</li>
                      <li>Click OK</li>
                    </ol>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                      <p className="text-sm text-amber-800">
                        💡 Alternatively, configure your router to assign a static IP via DHCP reservation.
                      </p>
                    </div>
                  </StepAccordion>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
                  <h4 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                    <Wifi className="w-5 h-5" />
                    Quick Access URLs
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
                      <Monitor className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">This Computer:</span>
                      <code className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">http://localhost/diary</code>
                    </div>
                    <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
                      <Network className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Other Devices:</span>
                      <code className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">http://YOUR-IP/diary</code>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Troubleshooting Section */}
            {activeSection === 'troubleshooting' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">🔧 Troubleshooting</h3>
                  <p className="text-gray-600">Common issues and solutions.</p>
                </div>

                <div className="space-y-4">
                  <div className="border border-red-200 rounded-xl overflow-hidden">
                    <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                      <h4 className="font-semibold text-red-800">❌ "This site can't be reached"</h4>
                    </div>
                    <div className="p-4 space-y-2 text-sm text-gray-600">
                      <p><strong>Causes:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>IIS is not running</li>
                        <li>Firewall blocking port 80</li>
                        <li>Wrong IP address</li>
                      </ul>
                      <p className="mt-3"><strong>Solutions:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Open IIS Manager and ensure "Default Web Site" is running (green play icon)</li>
                        <li>Check firewall settings (see Network Access section)</li>
                        <li>Verify IP with <code className="bg-gray-100 px-1 rounded">ipconfig</code></li>
                      </ul>
                    </div>
                  </div>

                  <div className="border border-red-200 rounded-xl overflow-hidden">
                    <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                      <h4 className="font-semibold text-red-800">❌ "403 Forbidden" or "404 Not Found"</h4>
                    </div>
                    <div className="p-4 space-y-2 text-sm text-gray-600">
                      <p><strong>Causes:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Files not in correct location</li>
                        <li>Missing index.html</li>
                        <li>Permission issues</li>
                      </ul>
                      <p className="mt-3"><strong>Solutions:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Verify index.html exists in <code className="bg-gray-100 px-1 rounded">C:\inetpub\wwwroot\diary\</code></li>
                        <li>Ensure IIS_IUSRS has read permission on the folder</li>
                        <li>Add web.config with defaultDocument setting</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border border-red-200 rounded-xl overflow-hidden">
                    <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                      <h4 className="font-semibold text-red-800">❌ "Browser does not support File System Access API"</h4>
                    </div>
                    <div className="p-4 space-y-2 text-sm text-gray-600">
                      <p><strong>Cause:</strong> Using Firefox, Safari, or old browser</p>
                      <p className="mt-3"><strong>Solution:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Use <strong>Google Chrome</strong> (recommended) or <strong>Microsoft Edge</strong></li>
                        <li>Make sure browser is updated to latest version</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border border-red-200 rounded-xl overflow-hidden">
                    <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                      <h4 className="font-semibold text-red-800">❌ Cannot access from other devices</h4>
                    </div>
                    <div className="p-4 space-y-2 text-sm text-gray-600">
                      <p><strong>Checklist:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Both devices on same WiFi/network?</li>
                        <li>Firewall rule added for port 80?</li>
                        <li>Using correct IP (not 127.0.0.1 or localhost)?</li>
                        <li>Try disabling Windows Firewall temporarily to test</li>
                      </ul>
                      <div className="mt-3">
                        <CodeBlock code={`# Test if port 80 is accessible from another device:\n# On the other device, try:\nping 192.168.1.100`} id="ping-test" />
                      </div>
                    </div>
                  </div>

                  <div className="border border-amber-200 rounded-xl overflow-hidden">
                    <div className="bg-amber-50 px-4 py-3 border-b border-amber-200">
                      <h4 className="font-semibold text-amber-800">⚠️ Data not saving / Permission denied</h4>
                    </div>
                    <div className="p-4 space-y-2 text-sm text-gray-600">
                      <p><strong>Note:</strong> The File System Access API requires user interaction to grant permissions.</p>
                      <p className="mt-2">Each user on each device must:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Click "Browse & Select Folder"</li>
                        <li>Navigate to the shared data folder</li>
                        <li>Click "Select Folder"</li>
                        <li>Approve the permission prompt</li>
                      </ol>
                      <div className="bg-amber-100 rounded-lg p-3 mt-3">
                        <p className="text-amber-800 text-xs">
                          💡 For network-shared data, create a folder like <code>C:\DiaryData</code> and share it 
                          on the network. Each device selects this network folder.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Useful Commands
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-blue-600 mb-1">Start IIS:</p>
                      <CodeBlock code="iisreset /start" id="iis-start" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 mb-1">Stop IIS:</p>
                      <CodeBlock code="iisreset /stop" id="iis-stop" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 mb-1">Restart IIS:</p>
                      <CodeBlock code="iisreset" id="iis-restart" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 mb-1">Check IIS Status:</p>
                      <CodeBlock code="sc query w3svc" id="iis-status" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
